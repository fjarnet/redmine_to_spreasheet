/*
 * REDMINE REST API Query - grab basic total responses 
 * http://www.redmine.org/projects/redmine/wiki/Rest_api
 *
 * Set up some basic parameters we need for connecting with REDMINE REST API
 * Fill in your account email, password,
 * and the URL where your project resides - cloud or server - where you log in
 *
 */










































var redmineuser = "XXX";
var redmineauth = "YYY";
var redmineurl  = "ZZZ";

/*
 * USAGE
 *
 * add this script to your Google sheet,
 * add your values above
 * and call this function below,
 *
 * Examples:
 * =callRedmine("")
 *
 * Using variations of these queries will allow you to build some stats that you 
 * can do further math with, like percentage of reopened/total stories, etc.
 *
 */
function callRedmine(query) {
  var query_url = "https://" + redmineurl + "/issues.json?" + query;
  var data = getProjectIssues(query_url);

  return data.total_count;
}

/*
 * USAGE
 *
 * Call this function below,
 *
 * A good way to set up your sheet, is to have ticket key (e.g. ABC-123) 
 * in left-most columns, then reference those with your specific function
 * in right-hand cells
 *
 * Examples:
 * =ticketStatus(A2) returns the ticket status name (e.g. "Open")
 *
 */
function ticketStatus(ticket) {
  var query_url = "https://" + redmineurl + "/issues/" + ticket + ".json?include=journals";
  var data = getProjectIssues(query_url);
  var status_name = data.issue.status.name;
  
  return status_name;
  
}

/*
 * Get list of issue status.
 */
function issueStatuses(id, property) {
  var parameters = _authParameters();
  var redmine_url = "https://" + redmineurl + "/issue_statuses.json";
  
  var text = UrlFetchApp.fetch(encodeURI(redmine_url), parameters).getContentText();
  var data = JSON.parse(text);
  
  if  ("id" === property) {
    return data.issue_statuses[id].id;
  }
  else if ("name" === property) {
    return data.issue_statuses[id].name;
  }
}

/*
 * Count ticket status depending to a specific status or a list of status,
 * based on journals update.
 */
function countToStatus(query, project_id, to_status, start_date, end_date) {

  // Be sure to status is consider as a string. 
  if (typeof to_status !== "string" && typeof to_status !== "undefined") {
    to_status = JSON.stringify(to_status);
  }

  // Split the issue list on comma separator `,`
  // then make sure that each status is consider as an integer.
  var to_status_array = to_status.split(",");
  for(var i = 0; i < to_status_array.length; i++) { 
    to_status_array[i] = +to_status_array[i];
  }

  if (typeof start_date !== 'undefined' && typeof end_date !== 'undefined') {
    var start_date_formated = new Date(start_date).toISOString();
    var end_date_formated = new Date(end_date).toISOString();

    // Get all issues without offset.
    var query_url = "https://" + redmineurl + "/issues.json?" + query + "&project_id=" + project_id;
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
      var query_url = "https://" + redmineurl + "/issues.json?" + query + "&project_id=" + project_id + "&offset=" + issue_limit;
      var data_issues = getProjectIssues(query_url);
      
      for (var issue in data_issues.issues) {
        issue_ids.push(data_issues.issues[issue].id);
      }
      
      issue_limit += data_issues.limit;
    }
    
    var count = 0;
    var increment = 0;
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
            if (data.issue.journals[journal].details[detail].name == "status_id" && to_status_array.indexOf(parseInt(data.issue.journals[journal].details[detail].new_value)) != -1) {            
              // If we match for an issue we can break the all loop of journal details parsing.
              increment = 1;
              count++;
              break;
            }
          }
          
          // If we match for an issue we can break the loop of journal parsing.
          if (increment == 1) { increment = 0; break; }
        }
      }
    });
  }
  
  return count || 0;
}

/*
 * Utils functions to get Query and Auth parameters.
 */
function _authParameters() {
  var parameters = {
    method : "get",
    accept : "application/json",
      headers: {"Authorization" : "Basic " + Utilities.base64Encode( redmineuser + ":" + redmineauth )}
      
  };

  return parameters;  
}

/*
 * Get project issue(s) details and cache the query.
 */
function getProjectIssues(query_url) {
  var cache = CacheService.getDocumentCache();
  var cache_key = "project-issues-" + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, query_url));
  var cached = cache.get(cache_key);
  if (cached != null) {
    return JSON.parse(cached);
  }
  
  var parameters = _authParameters();
  var text_issues = UrlFetchApp.fetch(encodeURI(query_url), parameters).getContentText();
  var data_issues = JSON.parse(text_issues);

  //Max cached value size: 100KB
  //According the ECMA-262 3rd Edition Specification, each character represents a single 16-bit unit of UTF-16 text
  var DESCRIPTOR_MARGIN = 2000;
  var MAX_STR_LENGTH = (100*1024 / 2) - DESCRIPTOR_MARGIN;
  if (data_issues !== null && typeof data_issues === 'string' && data_issues.length < MAX_STR_LENGTH) {
    cache.put(cache_key, JSON.stringify(data_issues), 60); // cache for 1500 = 25 minutes
  }

  return data_issues;
}

/*
 * Convert date to ISO format.
 */
function _convertISOtoDate(date) {
  var b = date.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}