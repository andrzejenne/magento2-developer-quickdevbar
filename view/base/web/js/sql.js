define(['jquery'], function ($) {
    const selectEl = $('#sql_profiles');
    const containerEl = $('#sql_queries');
    const renderers = {
        index: function(value, row, index) {
            return index + 1;
        },
        query: function(str) {
            return str;
        },
        duration: function(value) {
            return (value * 1000).toFixed(2) + ' ms';
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

    const tableViews = {
        default: {
            _index: {
                label: '#',
                renderer: renderers.index,
            },
            query: {
                label: 'SQL',
                renderer: renderers.query,
                className: 'sqlquery',
            },
            params: {
                label: 'Args',
                className: 'sqlargs',
            },
            elapsed: {
                label: 'Time',
                renderer: renderers.duration,
                className: 'sqltimer',
            },
            started: {
                label: '@at'
            },
            type: {
                label: 'Type',
                renderer: renderers.queryType,
            },
        },
    };

    function Profile(data, view = 'default', views = tableViews) {
        this.view = view;
        this.views = views;

        const self = this;

        function dummyRenderer(str) {
            return str;
        }

        function getView(view = self.view) {
            return self.views[view] ?? self.views['default'];
        }

        function getRenderer(field) {
            const view = getView();

            return view[field] ? (view[field].renderer ?? dummyRenderer): dummyRenderer;
        }

        function renderField(rowData, field, index) {
            const renderer = getRenderer(field, self.view);

            return renderer(rowData[field] ?? index, rowData, index);
        }

        function renderRow(el, rowData, index) {
            const row = $('<tr />');
            const view = getView();

            for(const field in view) {
                row.append(
                    $('<td />').html(renderField(rowData, field, index)).addClass(view[field].className ?? '')
                ).addClass('medium'); //.addClass(getGrade(rowData));
            }
            el.append(row);
        }

        this.renderTo = function(el) {
            const tableEl = $('<table/>').addClass('qdn_table striped filterable sortable tablesorter grade');
            const headEl = $('<thead/>');
            const bodyEl = $('<tbody/>');

            const view = getView();

            for (const field in view) {
                headEl.append($('<td/>').html(view[field].label ?? ''));
            }

            data.list.each(function(dataRow, index){
                renderRow(bodyEl, dataRow, index);
            });

            el.append(tableEl.append(headEl).append(bodyEl));
        }
    }

    function loadSqlProfilesList() {
        $.get({
            url: '/quickdevbar/sql/index/?isAjax=1',
            success: function(data) {
                let date;
                for (let ts in data) {
                    date = new Date(data[ts].datetime);
                    selectEl.prepend(
                        $('<option />')
                            .attr('value', data[ts].file)
                            .html(date.toLocaleString() + ' - ' + data[ts].request)
                    );
                }
            },
        });
    }

    function loadSqlProfile(name) {
        $.get({
            url: '/quickdevbar/sql/view/?isAjax=1&json=' + name,
            success: function(data) {
                const profile = new Profile(data);
                profile.renderTo(containerEl);
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
        loadCurrentSqlProfile();
    });

    loadSqlProfilesList();
});
