define([
    'jquery',
    "jquery/ui",
    "filtertable",
    "metadata",
    "tablesorter",
    'mage/cookies',
], function ($) {
    const selectEl = $('#sql_profiles');
    const statsContainerEl = $('#sql_stats');
    const tableContainerEl = $('#sql_queries');
    const queryHighlight = [
        [/\b(SET|AS|ASC|COUNT|DESC|IN|LIKE|DISTINCT|INTO|VALUES|LIMIT)\b/, '<span class="sqlword">$1</span>'],
        [/\b(UNION ALL|DESCRIBE|SHOW|connect|begin|commit)\b/, '<br/><span class="sqlother">$1</span>'],
        [/\b(UPDATE|SELECT|FROM|WHERE|LEFT JOIN|INNER JOIN|RIGHT JOIN|ORDER BY|GROUP BY|DELETE|INSERT)\b/, '<br/><span class="sqlmain">$1</span>']
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
            return '<span class="nowrap">' + (value * 1000).toFixed(2) + ' ms' + '</span>';
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
            label: 'Time',
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
    };

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
    };

    function Profile(data, view = 'default', views = tableViews, columns = tableColumns) {
        this.view = view;
        this.views = views;
        this.columns = columns;

        const self = this;

        function dummyRenderer(str) {
            return str;
        }

        function getView(view = self.view) {
            return self.views[view] ?? self.views['default'];
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
            data.list.forEach(function(row) {

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


        // <tr>
        //     <th>Longest</th>
        //     <td>
        //         <?php echo $block->formatSql($block->getLongestQuery()); ?>
        //     </td>
        // </tr>
        this.renderStatsTo = function(el) {
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
                <th></th>
                <td>
                    ${stats.queries}
                </td>
            </tr>
            <tr>
                <th></th>
                <td>
                    <span>(${stats.longestQueryTime})</span>
                </td>
            </tr>
            `);

            el.empty().append(tableEl);
        }

        this.renderTableTo = function(el) {
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

            data.list.forEach(function(dataRow, index){
                renderRow(bodyEl, dataRow, index);
            });

            el.empty();
            el.append(tableEl.append(headEl).append(bodyEl));

            tableEl.tablesorter();
        }
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
                const profile = new Profile(data, 'slim');
                // @todo - view change
                profile.renderStatsTo(statsContainerEl);
                profile.renderTableTo(tableContainerEl);
                console.info(data);
            },
        });
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

    loadSqlProfilesList();
});
