$(document).ready(function() {
  /***************************
  Hide UI, if user is not logged in
  ***************************/
  $('.search-feature, .header-main').hide();


  function searchHelpCenter (searchString, subdomain) {
    var helpCenterRequest = new XMLHttpRequest()
    helpCenterRequest.open("GET", "https://" + subdomain + ".zendesk.com/api/v2/help_center/articles/search.json?query=" + searchString, false);
    helpCenterRequest.send();
    return helpCenterRequest;
  }

  function startSearch () {
    var searchInput = document.getElementById("search-box").value;
    if (searchInput === "") {
      document.getElementById("search-box").style.borderBottom = "0.25vw solid gray";
    } else {
      console.log(searchInput);
      document.getElementById("search-box").style.borderBottom = "0.25vw solid white";
      var searchResults = searchHelpCenter(searchInput, 'physiotherapiemartin');
      console.log(searchResults);
    }
  }

});