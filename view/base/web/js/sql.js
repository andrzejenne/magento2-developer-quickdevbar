define([
    'jquery',
    "jquery/ui",
    "filtertable",
    "metadata",
    "tablesorter",
    'mage/cookies',
], function ($) {
    let profile;

    const selectEl = $('#sql_profiles');
    const statsContainerEl = $('#sql_stats');
    const tableContainerEl = $('#sql_queries');
    const selectAggregationsEl = $('#sql_aggregations');
    const queryHighlight = [
        [/\b(SET|AS|ASC|COUNT|DESC|IN|LIKE|DISTINCT|INTO|VALUES|LIMIT)\b/, '<span class="sqlword">$1</span>'],
        [/\b(UNION ALL|DESCRIBE|SHOW|connect|begin|commit)\b/, '<span class="sqlother">$1</span>'],
        [/\b(UPDATE|SELECT|FROM|WHERE|LEFT JOIN|INNER JOIN|RIGHT JOIN|ORDER BY|GROUP BY|DELETE|INSERT)\b/, '<span class="sqlmain">$1</span>']
    ];

    const renderers = {
        index: function(value, row, index) {
            return index + 1;
        },
        query: function(str) {
            for(let i = 0; i < queryHighlight.length; i++) {
                str = str.replace(queryHighlight[i][0], queryHighlight[i][1]);
            }

            return str;
        },
        json: function(val) {
            return JSON.stringify(val);
        },
        duration: function(value) {
            return (value * 1000).toFixed(2);
        },
        queryType: function(value) {
            switch(value) {
                case 1:
                    return 'CONNECT';
                case 2:
                    return 'SET';
                case 8:
                    return 'UPDATE';
                case 32:
                    return 'SELECT';
                case 64:
                    return 'BEGIN';
                default:
                    return 'unknown ' + value;
            }
        }
    };

    const tableColumns = {
        _index: {
            label: '#',
            sorter: 'digit',
            style: {
                width: 64,
            },
            renderer: renderers.index,
        },
        query: {
            label: 'SQL',
            sorter: 'text',
            renderer: renderers.query,
            className: 'sqlquery',
        },
        params: {
            label: 'Args',
            sorter: 'text',
            className: 'sqlargs',
            renderer: renderers.json,
        },
        elapsed: {
            label: 'Time [ms]',
            sorter: 'digit',
            style: {
                width: 100,
            },
            renderer: renderers.duration,
            className: 'sqltimer',
        },
        started: {
            label: '@at',
            sorter: 'digit',
            style: {
                width: 100,
            },
        },
        type: {
            label: 'Type',
            sorter: 'text',
            renderer: renderers.queryType,
        },
        count: {
            label: 'Count',
            sorter: 'digit',
        },
        totalElapsed: {
            label: 'Total time [ms]',
            renderer: renderers.duration,
        }
    };

    const dataAggregations = {
        default: {
            label: 'Default',
        },
        queryAndArgs: {
            label: 'Query and Arguments',
            transform: function(data) {
                const aggregated = [];
                const queriesArgsMap = [];
                data.list.forEach(function(profile, index){
                    const hash = profile.query + JSON.stringify(profile.params);
                    if (!queriesArgsMap[hash]) {
                        queriesArgsMap[hash] = {...profile};
                        aggregated.push(queriesArgsMap[hash]);
                        queriesArgsMap[hash].count = 1;
                        queriesArgsMap[hash].totalElapsed = profile.elapsed;
                    } else {
                        queriesArgsMap[hash].count++;
                        queriesArgsMap[hash].totalElapsed += profile.elapsed;
                    }
                });

                return aggregated;
            }
        }
    }

    const tableViews = {
        slim: [
            '_index',
            'query',
            'params',
            'elapsed',
        ],
        default: [
            '_index',
            'query',
            'params',
            'elapsed',
            'started',
            'type',
        ],
        aggregated: {
            default: [
                'query',
                'count',
                'totalElapsed'
            ],
            slim: [
                'query',
                'count',
                'totalElapsed'
            ]
        }
    };

    function Profile(data, view = 'default', aggregation = 'default', views = tableViews, columns = tableColumns) {
        this.view = view;
        this.views = views;
        this.columns = columns;
        this.aggregation = aggregation;

        let longest = {};
        let containers;

        const self = this;

        function dummyRenderer(str) {
            return str;
        }

        function getView(view = self.view) {
            if (self.aggregation === 'default') {
                return self.views[view] ?? self.views.default;
            }

            return self.views.aggregated[view] ?? self.views.default;
        }

        function getRenderer(field) {
            const fieldConfig = columns[field] ?? {};

            return fieldConfig.renderer ?? dummyRenderer;
        }

        function renderField(rowData, field, index) {
            const renderer = getRenderer(field);

            return renderer(rowData[field] ?? index, rowData, index);
        }

        function computeStats() {
            longest = {};
            data.list.forEach((profile) => {
                if (!longest.elapsed || longest.elapsed < profile.elapsed) {
                    longest = profile;
                }
            });
        }

        function renderRow(el, rowData, index) {
            const row = $('<tr />');
            const view = getView();

            view.forEach(function(field){
                const fieldConfig = columns[field] ?? {};

                row.append(
                    $('<td />').html(
                        renderField(rowData, field, index)
                    )
                    .addClass(fieldConfig.className ?? '')
                ).addClass('medium'); //.addClass(getGrade(rowData));
            })
            el.append(row);
        }

        function getStats() {
            const totalNum = data.stats.numberOfQueries.total;
            const totalElapsedSeconds = data.stats.totalElapsedSecs ? (Math.round(1000 * data.stats.totalElapsedSecs)).toFixed(2) + 'ms' : '?';
            const averageTime = (data.stats.numberOfQueries.total && data.stats.totalElapsedSecs ?
                1000 * data.stats.totalElapsedSecs / totalNum : 0).toFixed(2) + 'ms';
            const numPerSecond = data.stats.numberOfQueries.total && data.stats.totalElapsedSecs ?
                    Math.round(totalNum / data.stats.totalElapsedSecs) : '?';

            return {
                statistics: `${totalNum} queries in ${totalElapsedSeconds} (average time: ${averageTime}) 
                - ${numPerSecond} queries/second`,
                queries: `${data.stats.numberOfQueries.select} SELECT 
                - ${data.stats.numberOfQueries.insert} INSERT 
                - ${data.stats.numberOfQueries.update} UPDATE 
                - ${data.stats.numberOfQueries.delete} DELETE 
                - ${data.stats.numberOfQueries.transaction} TRANSACTION`,
                longestQueryTime: 0
            };
        }

        function renderStatsTo(el) {
            const tableEl = $('<table/>').addClass('qdn_table_2col');
            const stats = getStats();

            tableEl.html(`
            <tr>
                <th>Request</th>
                <td>${data.server.args.REQUEST_URI}</td>
            </tr>
            <tr>
                <th>Statistics</th>
                <td>
                    ${stats.statistics}
                </td>
            </tr>
            <tr>
                <th>Longest</th>
                <td>
                    ${stats.queries}
                </td>
            </tr>
            <tr>
                <th></th>
                <td>
                    <span>(${renderers.duration(longest.elapsed)})</span>
                </td>
            </tr>
            <tr>
                <th></th>
                <td>
                    ${renderers.query(longest.query)}
                </td>
            </tr>
            `);
            el.empty().append(tableEl);
        }

        function renderTableTo(el) {
            const tableEl = $('<table/>').addClass('qdn_table striped filterable sortable tablesorter grade');
            const headEl = $('<thead/>');
            const headRowEl = $('<tr />').appendTo(headEl);
            const bodyEl = $('<tbody/>');

            const view = getView();

            view.forEach(function(field){
                const fieldConfig = columns[field] ?? {};

                const thEl = $('<th/>')
                    .html(fieldConfig.label ?? '')
                    .addClass(`header {sorter: '${fieldConfig.sorter}'}`);

                headRowEl.append(
                    thEl
                );

                if (fieldConfig.style) {
                    thEl.css(fieldConfig.style);
                }
            });

            getDataForDisplay().forEach(function(dataRow, index){
                renderRow(bodyEl, dataRow, index);
            });

            el.empty();
            el.append(tableEl.append(headEl).append(bodyEl));

            tableEl.tablesorter();
        }

        function getDataForDisplay() {
            if (self.aggregation === 'default') {
                return data.list;
            }

            return data.aggregated;
        }

        function aggregate() {
            const aggregation = dataAggregations[self.aggregation];
            if (aggregation.transform) {
                data.aggregated = aggregation.transform(data);
            }
        }

        function beforeRender() {
            computeStats();
            aggregate();
        }

        this.renderTo = function(statsEl, tableEl) {
            beforeRender();
            renderStatsTo(statsEl);
            renderTableTo(tableEl);
            containers = [statsEl, tableEl];
        }

        this.refresh = function() {
            this.renderTo(containers[0], containers[1]);
        }

        this.setAggregation = function(aggregation) {
            this.aggregation = aggregation;
            this.refresh();
        }

    }

    function getAggregation() {
        return selectAggregationsEl.val();
    }

    function loadSqlProfilesList() {
        $.get({
            url: '/quickdevbar/sql/index/?isAjax=1',
            success: function(data) {
                let date, ts;
                for (ts in data) {
                    date = new Date(data[ts].datetime);
                    selectEl.prepend(
                        $('<option />')
                            .attr('value', data[ts].file)
                            .html(date.toLocaleTimeString() + ' - ' + data[ts].request + ' - ' + data[ts].numQueries)
                    );
                }

                selectEl.val(data[ts].file).change();
            },
        });
    }

    function loadSqlProfile(name) {
        $.get({
            url: '/quickdevbar/sql/view/?isAjax=1&json=' + name,
            success: function(data) {
                profile = new Profile(data, 'slim', getAggregation());
                // @todo - view change
                profile.renderTo(statsContainerEl, tableContainerEl);
                console.info(data);
            },
        });
    }

    function renderAggregations() {
        for (const prop in dataAggregations) {
            selectAggregationsEl.append(`<option value="${prop}">${dataAggregations[prop].label}</option>`);
        }

        selectAggregationsEl.val('default');
    }

    function loadCurrentSqlProfile() {
        loadSqlProfile(
            selectEl.val()
        );
    }

    $('#clear').click(function() {
        $.get({
            url: '/quickdevbar/sql/clear/?isAjax=1',
            success: function() {
                selectEl.empty();
            },
        });
    });

    selectEl.change(function() {
        console.info('request changed to', $(this).val());
        loadSqlProfile($(this).val());
    });

    selectAggregationsEl.change(function() {
        console.info('aggregation changed to', $(this).val());
        profile.setAggregation(
            getAggregation()
        );
    });

    loadSqlProfilesList();
    renderAggregations();
});
