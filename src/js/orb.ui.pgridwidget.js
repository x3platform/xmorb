/**
 * @fileOverview Pivot Grid axe viewmodel
 * @author Najmeddine Nouri <najmno@gmail.com>
 */

'use strict';

/* global module, require, React, window */
/*jshint eqnull: true*/
//var ReactDOM = require( 'react-dom')
//var React require ('react')
var axe = require('./orb.axe');
var pgrid = require('./orb.pgrid');
var uiheaders = require('./orb.ui.header');
var uirows = require('./orb.ui.rows');
var uicols = require('./orb.ui.cols');
//var React = require('react');
var OrbReactComps = require('./react/orb.react.compiled');
/**
 * Creates a new instance of pivot grid control
 * @class
 * @memberOf orb.ui
 * @param  {object} pgrid - pivot grid instance
 */
module.exports = function(config) {

    var self = this;
    var renderElement;
    var pivotComponent;
    var dialog = OrbReactComps.Dialog.create();
	
	this.originConfig=config;
	

	
    /**
     * Parent pivot grid
     * @type {orb.pgrid}
     */
    this.pgrid = new pgrid(config);

    /**
     * Control rows headers
     * @type {orb.ui.rows}
     */
    this.rows = null;
    /**
     * Control columns headers
     * @type {orb.ui.cols}
     */
    this.columns = null;

    /**
     * Control data rows
     * @type {orb.ui.CellBase}
     */
    this.dataRows = [];

    this.layout = {
        rowHeaders: {
            /**
             * Total number of horizontal row headers.
             * @type {Number}
             */
            width: null,
            /**
             * Total number of vertical row headers.
             * @type {Number}
             */
            height: null
        },
        columnHeaders: {
            /**
             * Total number of horizontal column headers.
             * @type {Number}
             */
            width: null,
            /**
             * Total number of vertical column headers.
             * @type {Number}
             */
            height: null,
        },
        pivotTable: {
            /**
             * Total number of horizontal cells of the whole pivot grid control.
             * @type {Number}
             */
            width: null,
            /**
             * Total number of vertical cells of the whole pivot grid control.
             * @type {Number}
             */
            height: null
        }
    };

    this.sort = function(axetype, field) {
        if (axetype === axe.Type.ROWS) {
            self.pgrid.rows.sort(field);
        } else if (axetype === axe.Type.COLUMNS) {
            self.pgrid.columns.sort(field);
        } else {
            return;
        }

        buildUi();
    };

    this.refreshData = function(data) {
        self.pgrid.refreshData(data);
        buildUi();
        pivotComponent.setProps({});
    };

    this.applyFilter = function(fieldname, operator, term, staticValue, excludeStatic) {
        self.pgrid.applyFilter(fieldname, operator, term, staticValue, excludeStatic);
        buildUi();
    };
	this.replaceField =function(field, oldAxeType, newAxeType, position) {
		//zzj just for charts
		//console.log("replaceField",self.pgrid.config);
		if(!self.pgrid.moveField(self.pgrid.config.rowFields[0].name, axe.Type.ROWS, null, position)) {
			return false;
		}
		if(self.pgrid.moveField(field, oldAxeType, newAxeType, position)) {
            buildUi();
           
            return true;
        }
        return false;
    };
    this.moveField = function(field, oldAxeType, newAxeType, position) {
		//zzj
		//console.log("moveField",self.pgrid.config);
		if(self.pgrid.moveField(field, oldAxeType, newAxeType, position)) {
            buildUi();
            
            return true;
        }
        return false;
    };

    this.toggleFieldExpansion = function(axetype, field, newState) {
        if(axetype === axe.Type.ROWS) {
            return self.rows.toggleFieldExpansion(field, newState);
        } else if(axetype === axe.Type.COLUMNS) {
            return self.columns.toggleFieldExpansion(field, newState);
        }
        return false;
    };

    this.toggleSubtotals = function(axetype) {
        if(self.pgrid.config.toggleSubtotals(axetype)) {
            buildUi();
            return true;    
        }
        return false;        
    };

    this.areSubtotalsVisible = function(axetype) {
        return self.pgrid.config.areSubtotalsVisible(axetype);
    };

    this.toggleGrandtotal = function(axetype) {
        if(self.pgrid.config.toggleGrandtotal(axetype)) {
            buildUi();
            return true;    
        }
        return false;
    };

    this.isGrandtotalVisible = function(axetype) {
        return self.pgrid.config.isGrandtotalVisible(axetype);
    };

    this.changeTheme = function(newTheme) {
        pivotComponent.changeTheme(newTheme);
    };

    this.render = function(element) {
        renderElement = element;
        if(renderElement) {
            var pivotTableFactory = React.createFactory(OrbReactComps.PivotTable);
            var pivottable = pivotTableFactory({
                pgridwidget: self
            });

            pivotComponent = React.render(pivottable, element);
			this.pivotComponent=pivotComponent;
        }
    };

    this.drilldown = function(dataCell, pivotId) {
        if(dataCell) {
            var colIndexes = dataCell.columnDimension.getRowIndexes();
            var data = dataCell.rowDimension.getRowIndexes().filter(function(index) {
                return colIndexes.indexOf(index) >= 0;
            }).map(function(index) {
                return self.pgrid.filteredDataSource[index];
            });

            var title;
            if(dataCell.rowType === uiheaders.HeaderType.GRAND_TOTAL && dataCell.colType === uiheaders.HeaderType.GRAND_TOTAL) {
                title = 'Grand total';
            } else {
                if(dataCell.rowType === uiheaders.HeaderType.GRAND_TOTAL) {
                    title = dataCell.columnDimension.value + '/Grand total ';
                } else if(dataCell.colType === uiheaders.HeaderType.GRAND_TOTAL) {
                    title = dataCell.rowDimension.value + '/Grand total ';
                } else {
                    title = dataCell.rowDimension.value + '/' + dataCell.columnDimension.value;
                }
            }

            var pivotStyle = window.getComputedStyle( pivotComponent.getDOMNode(), null );

            dialog.show({
                title: title,
                comp: {
                    type: OrbReactComps.Grid,
                    props: {                    
                        headers: self.pgrid.config.getDataSourceFieldCaptions(),
                        data: data,
                        theme: self.pgrid.config.theme
                    }
                },
                theme: self.pgrid.config.theme,
                style: {
                    fontFamily: pivotStyle.getPropertyValue('font-family'),
                    fontSize: pivotStyle.getPropertyValue('font-size')
                }
            });
        }
    };

    buildUi(false);

    function buildUi(shouldCallDimensionChange=true) {
		//console.log("buildUi");
        // build row and column headers
        self.rows = new uirows(self.pgrid.rows);
        self.columns = new uicols(self.pgrid.columns);
		//console.log(self.rows,self.columns);
        var rowsHeaders = self.rows.headers;
        var columnsLeafHeaders = self.columns.leafsHeaders;
        //console.log("new rows",self.rows,self.columns);
		//console.log("new pgrid",self.pgrid);
        // set control layout infos		
        self.layout = {
            rowHeaders: {
                width: (self.pgrid.rows.fields.length || 1) +
                       (self.pgrid.config.dataHeadersLocation === 'rows' && self.pgrid.config.dataFieldsCount > 1 ? 1 : 0),
                height: rowsHeaders.length
            },
            columnHeaders: {
                width: self.columns.leafsHeaders.length,
                height: (self.pgrid.columns.fields.length || 1) +
                        (self.pgrid.config.dataHeadersLocation === 'columns' && self.pgrid.config.dataFieldsCount > 1 ? 1 : 0)
            }
        };

        self.layout.pivotTable = {
            width: self.layout.rowHeaders.width + self.layout.columnHeaders.width,
            height: self.layout.rowHeaders.height + self.layout.columnHeaders.height
        };

        var dataRows = [];
        var arr;

        function createVisibleFunc(rowvisible, colvisible) {
            return function() {
                return rowvisible() && colvisible();
            };
        }
        if(rowsHeaders.length > 0) {
            for (var ri = 0; ri < rowsHeaders.length; ri++) {
                var rowHeadersRow = rowsHeaders[ri];
                var rowLeafHeader = rowHeadersRow[rowHeadersRow.length - 1];

                arr = [];
                for (var colHeaderIndex = 0; colHeaderIndex < columnsLeafHeaders.length; colHeaderIndex++) {
                    var columnLeafHeader = columnsLeafHeaders[colHeaderIndex];
                    var isvisible = createVisibleFunc(rowLeafHeader.visible, columnLeafHeader.visible);
                    arr[colHeaderIndex] = new uiheaders.dataCell(self.pgrid, isvisible, rowLeafHeader, columnLeafHeader);
                }
                dataRows.push(arr);
            }
        }
        self.dataRows = dataRows;
		//console.log("self.rows",self.rows);
		//console.log("self.columns",self.columns);
		//console.log("buildUi",(dataRows));
		 if(shouldCallDimensionChange && self.originConfig && (typeof self.originConfig.onDimensionChange)=="function"){
                self.originConfig.onDimensionChange(self.pgrid.config,dataRows);
        }
    }
    this.buildUi=buildUi;
};
