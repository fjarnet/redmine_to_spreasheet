/*
 * Get all issues statuses in Redmine.
 */
function getIssueTypes() {
  var parameters = _authParameters();
  var redmine_url = "https://" + redmineurl + "/issue_statuses.json";
  
  var text = UrlFetchApp.fetch(encodeURI(redmine_url), parameters).getContentText();
  var dataAll = JSON.parse(text);

  var dataSet = dataAll.issue_statuses; // "issue_statuses" is the key containing the relevant objects
  
  var rows = [],
      data;
  
  for (i = 0; i < dataSet.length; i++) {
    data = dataSet[i];
    rows.push([data.id, data.name]); //your JSON entities here
  }

  insertToSpreadsheet("Issue Status", 2, 1, 2, rows);
}