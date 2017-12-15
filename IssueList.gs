/*
 * Form handlers.
 */
function getIssuesForm(formObject) {
  var startDate = formObject.startdate;
  var endDate = formObject.enddate;
  var query = formObject.query;
  
  getIssues(startDate, endDate, query);
  
  return "Done !";
}

/*
 * Get all issues, depends of query, start date and end date,
 * then insert results into the spreadsheet.
 */
function getIssues(startDate, endDate, query) {
  
  var issues_list = getIssuesList(query, startDate, endDate);
 
  // Number of colums in array.
  var numColums = 6;
  insertToSpreadsheet("Issues List", 1, 1, numColums, issues_list);
}

/*
 * Count ticket status depending on journals update.
 */
function getIssuesList(query, start_date, end_date) {
  if (typeof start_date !== 'undefined' && typeof end_date !== 'undefined') {
    var start_date_formated = new Date(start_date).toISOString();
    var end_date_formated = new Date(end_date).toISOString();

    // Get all issues without offset.
    SpreadsheetApp.getActiveSpreadsheet().toast('Loading issues ...', 'Redmine');
    var query_url = "https://" + redmineurl + "/issues.json?" + query;
    var data_issues = getProjectIssues(query_url);

    // Set list of issue ids.
    var issue_ids  = [];
    for (var issue in data_issues.issues) {
      issue_ids.push(data_issues.issues[issue].id);
    }
    
    // Get issues ids with offset if the total result is greater than the limit value (defaut to 25, max to 100).
    var issue_limit = data_issues.limit;
    var total_count = data_issues.total_count;
    
    while (issue_limit <= total_count) {
      var query_url = "https://" + redmineurl + "/issues.json?" + query + "&offset=" + issue_limit;
      var data_issues = getProjectIssues(query_url);
      
      for (var issue in data_issues.issues) {
        issue_ids.push(data_issues.issues[issue].id);
      }
      
      issue_limit += data_issues.limit;
    }
    
    SpreadsheetApp.getActiveSpreadsheet().toast(total_count + ' issues loaded !', 'Redmine');
    
    var excluded_user_ids = [
      157, // Alice Le Goff
      172, // Stéphane Bienaimé
      161, // Delphine Fagot
      188, // Anne Charrier
      455, // Auriane Loyer
      397, // Evgeniia Sergeeva
      206, // Julie Moulin
      160, // David Fabbro
    ];
    
    var count = 0;
    var increment = 0;
    var issue_list = [];
    // Set headers.
//    issue_list.push(["Project", "ID", "Titre", "Tracker", "Current Status", "Old Status", "New Status", "Jalon", "Complexite"]);
    issue_list.push(["Project", "ID", "Titre", "Tracker", "Status", "Jalon"]);
    
    issue_ids.forEach(function(element) {      
      var query_url = "https://" + redmineurl + "/issues/" + element + ".json?include=journals";
      var data = getProjectIssues(query_url);

      // Parse the journals of an issue.
      var limit = 0;
      for (var journal in data.issue.journals) {
        if (limit >= 1) { break; }
        var created_on = _convertISOtoDate(data.issue.journals[journal].created_on).toISOString();
        var start_diff = _convertISOtoDate(created_on) - _convertISOtoDate(start_date_formated);
        var end_diff = _convertISOtoDate(end_date_formated) - _convertISOtoDate(created_on);
        
        if (start_diff > 0 && end_diff > 0) {
          for (var detail in data.issue.journals[journal].details) {
            var user_is_excluded = false;
            for (var n in excluded_user_ids) {
              if (excluded_user_ids[n] == data.issue.journals[journal].user.id) {
                log('#' + data.issue.id + ' - ' + data.issue.subject + ' - Action user non tracké (' + data.issue.journals[journal].user.name + ')');
                user_is_excluded = true;
                break;
              }
            }
            if (user_is_excluded) {
              continue;
            }
            
            if (true /*data.issue.journals[journal].details[detail].name == "status_id" && parseInt(data.issue.journals[journal].details[detail].new_value) != -1*/) {            
              // If we match for an issue we can break the all loop of journal details parsing.
              increment = 1;
              for (var custom_field in data.issue.custom_fields) {
                if (data_issues.issues[issue].custom_fields[custom_field].id === 1) {
                  var jalon = JSON.stringify(data.issue.custom_fields[custom_field].value);
                }
                if (data.issue.custom_fields[custom_field].id === 6) {
                  var complexite = data.issue.custom_fields[custom_field].value;
                }
              }
              
//              issue_list.push([data.issue.project.name, data.issue.id, data.issue.subject, data.issue.tracker.name, data.issue.status.name, data.issue.journals[journal].details[detail].old_value,  data.issue.journals[journal].details[detail].new_value, jalon, complexite]);
              issue_list.push([data.issue.project.name, '#' + data.issue.id, data.issue.subject, data.issue.tracker.name, data.issue.status.name, jalon]);
            
//              log('#' + data.issue.id + ' - ' + data.issue.subject);
              
              break;
            }
          }
          
          // If we match for an issue we can break the loop of journal parsing.
          if (increment == 1) { increment = 0; break; }
        }
      }
    });
  }
  SpreadsheetApp.getActiveSpreadsheet().toast('Done !', 'Redmine');
  
  return issue_list;
}