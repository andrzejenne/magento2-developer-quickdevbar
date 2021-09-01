var config = {
    paths: {
        quickDevBar:  "ADM_QuickDevBar/js/quickdevbar",
        filtertable:  "ADM_QuickDevBar/js/sunnywalker/jquery.filtertable.min",
        metadata:  "ADM_QuickDevBar/js/tablesorter/jquery.metadata",
        tablesorter:  "ADM_QuickDevBar/js/tablesorter/jquery.tablesorter.min",
        quickDevBarSql: "ADM_QuickDevBar/js/sql"
    },
    shim: {
        'quickDevBar': {
            deps: ['jquery']
        },
        'filtertable': {
            deps: ['jquery']
        },
        'metadata': {
            deps: ['jquery']
        },
        'tablesorter': {
            deps: ['jquery']
        },
        'quickDevBarSql': {
            deps: ['jquery']
        }
    }
};
