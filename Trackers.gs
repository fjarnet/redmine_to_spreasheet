/*
 * Get all trackers in Redmine.
 */
function getTrackers() {
  var parameters = _authParameters();
  var redmine_url = "https://" + redmineurl + "/trackers.json";
  
  var text = UrlFetchApp.fetch(encodeURI(redmine_url), parameters).getContentText();
  var dataAll = JSON.parse(text);

  var dataSet = dataAll.trackers; // "issue_statuses" is the key containing the relevant objects
  
  var rows = [],
      data;
  
  for (i = 0; i < dataSet.length; i++) {
    data = dataSet[i];
    rows.push([data.id, data.name]); //your JSON entities here
  }

  insertToSpreadsheet("Trackers", 2, 1, 2, rows);
}