/*
 * Execute that function on Spreadsheet opening and create custom menu.
 */
function onOpen() {
 var ss = SpreadsheetApp.getActiveSpreadsheet(),
     options = [
      {name:"Update Statuses List", functionName:"getIssueTypes"},
      {name:"Update Trackers List", functionName:"getTrackers"},
      {name:"Get issues", functionName:"showIssuesSidebar"}
     ];
 ss.addMenu("Clever Age Redmine", options);

}

/*
 * That will load the Page.html template and display the sidebar.
 */
function showIssuesSidebar() {
  var html = HtmlService.createTemplateFromFile('Page')
      .evaluate();

  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showSidebar(html);
}

/*
 * Utils function to insert data into the spreadsheet.
 */
function insertToSpreadsheet(spreadsheetName, row, column, numColumns, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var sheet = ss.getSheetByName(spreadsheetName);

  // [row to start on], [column to start on], [number of rows], [number of entities]
  dataRange = sheet.getRange(row, column, rows.length, numColumns);
  dataRange.setValues(rows);
}

function subDaysFromDate(date,d){
  // d = number of day ro substract and date = start date
  var result = new Date(date.getTime()-d*(24*3600*1000));
  return result
}