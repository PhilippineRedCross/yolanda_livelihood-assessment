

// global variables
// ================
var surveyDataBaseline = [];
var surveyDataEndline = [];

var filteredDataBaseline = [];
var filteredDataEndline = [];

var surveyQuestions = [];
var answers = ["agree_strongly", "agree", "neither", "disagree", "disagree_strongly", "unsure", "na"];

var summedResponsesBaseline = [];
var summedResponsesEndline = [];

var totalCountBaseline = 0;
var totalCountEndline = 0;


var adminLookup = {
	"PH060400000" :	"Aklan",
	"PH060600000" :	"Antique",
	"PH061900000" :	"Capiz",
	"PH063000000" :	"Iloilo",
	"PH072200000" :	"Cebu",
	"PH083700000" :	"Leyte",
	"PH175300000" :	"Palawan",
	"PH086000000" :	"Samar (Western)",
	"PH082600000" :	"Eastern Samar"
};

// helper functions
// ================

// comma seperator for thousands
var formatCommas = d3.format(",");

//round to one decimal
var noDecimal = d3.format(".0f");

// function chain
// ==============

// get CSV files
function getDataBaseline(){
  d3.csv("data/HLA-SurveyDataBaseline.csv", function(data){
    surveyDataBaseline = data;
    getDataEndline();
  });
}

function getDataEndline(){
  d3.csv("data/HLA-SurveyDataEndline.csv", function(data){
    surveyDataEndline = data;
    getQuestions();
  });
}

function getQuestions(){
  d3.csv("data/SurveyQuestions.csv", function(data){
    surveyQuestions = data;
    buildHtml();
  });
}

function buildHtml() {
	totalCountBaseline = surveyDataBaseline.length;
	$("#surveyCountBaseline").html(totalCountBaseline);

	totalCountEndline = surveyDataEndline.length;
	$("#surveyCountEndline").html(totalCountEndline);

	$.each(surveyQuestions, function(index, question){
		var sectionId = '#' + question.id;
		var questionHtml = '<div id="' + question.name + '" class="question-block">' +
			'<h5>' + question.label +
			((question.hint !== "none") ? '<br><small>' + question.hint + '</small>' : '') +
			'<br><span class="text-tagalog">' + question["label-tagalog"] + '</span>' +
			((question["hint-tagalog"] !== "none") ? '<br><small><span class="text-tagalog">' +
			question["hint-tagalog"] + '</span>' + '</small>' : '') +

			'</h5><div class="responsesBar">' +
	          '<svg width="100%" height="30">' +
	            '<rect class="response-bar response-baseline na" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-baseline unsure" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-baseline disagree_strongly" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-baseline disagree" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-baseline neither" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-baseline agree" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-baseline agree_strongly" y="0" height="100%" ></rect>' +
	          '</svg>' +
			'</div>'+
			'<div class="responsesBar responsesEndline">' +
	          '<svg width="100%" height="30">' +
	            '<rect class="response-bar response-endline na" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-endline unsure" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-endline disagree_strongly" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-endline disagree" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-endline neither" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-endline agree" y="0" height="100%" ></rect>' +
	            '<rect class="response-bar response-endline agree_strongly" y="0" height="100%" ></rect>' +
	          '</svg>' +
			'</div>'

			;
		$(sectionId).append(questionHtml);
		var questionId = '#' + question.name;
	});
	buildProvinceDropdown();
}

function buildProvinceDropdown() {
  var provinceList = [];
	// baseline
	// ========
  $.each(surveyDataBaseline, function(index, survey){
    var thisProvincePcode = survey["municipality"].slice(0,6) + "00000";
    var thisProvince = adminLookup[thisProvincePcode];
    survey["provinceName"] = thisProvince;
    if(thisProvince == undefined){console.log(thisProvincePcode);}
    if($.inArray(thisProvince, provinceList) === -1){
      provinceList.push(thisProvince);
    }
  });
	// endline
	// ========
	$.each(surveyDataEndline, function(index, survey){
    var thisProvincePcode = survey["municipality"].slice(0,6) + "00000";
    var thisProvince = adminLookup[thisProvincePcode];
    survey["provinceName"] = thisProvince;
    if(thisProvince == undefined){console.log(thisProvincePcode);}
    if($.inArray(thisProvince, provinceList) === -1){
      provinceList.push(thisProvince);
    }
  });
  // sort so that the regions appear in alphabetical order in dropdown
  provinceList = provinceList.sort();
  // create item elements in dropdown list
  for(var i = 0; i < provinceList.length; i++) {
      var item = provinceList[i];
      var listItemHtml = '<li><a href="#" onClick="provinceSelect(' +"'"+ item +"'"+ '); return false;">' + item + "</li>"
      $('#dropdown-menu-province').append(listItemHtml);
  }
  provinceSelect("ALL");
}

function provinceSelect(selection){
	filteredDataBaseline = [];
	filteredDataEndline = [];
	if(selection == "ALL"){
		$("#selected-admin-label").html("All surveyed provinces");
		filteredDataBaseline = surveyDataBaseline;
		filteredDataEndline = surveyDataEndline;

	} else {
		$("#selected-admin-label").html(selection);
		$.each(surveyDataBaseline, function(index, survey){
			if(survey.provinceName == selection){
				filteredDataBaseline.push(survey);
			}
		});
		$.each(surveyDataEndline, function(index, survey){
			if(survey.provinceName == selection){
				filteredDataEndline.push(survey);
			}
		});
	}
	$("#selected-survey-count-baseline").html(filteredDataBaseline.length);
	$("#selected-survey-count-endline").html(filteredDataEndline.length);

	parseData();
}


function parseData() {

	// baseline
	// ========
	summedResponsesBaseline = [];
	// count up responses by question (A01, A02, ...) and answer (strongly_agree, agree, ...)
	$.each(surveyQuestions, function(questionIndex, question){
		var questionObject = {};
		var answerCountsObject = {};
		$.each(answers, function(answerIndex, answer){
			answerCountsObject[answer] = 0;
		});
		questionObject[question.name] = answerCountsObject;

		$.each(filteredDataBaseline, function(responseIndex, response){
			var thisAnswer = response[question.name];
			questionObject[question.name][thisAnswer] += 1;
		});
		summedResponsesBaseline.push(questionObject);
		// summedResponsesBaseline = { {A01: {agree:52, agree_strongly:5, disagree:16, ...}},{A02: {agree:56; ...}}, ... }
	});

	// endline
	// ========
	summedResponsesEndline = [];
	// count up responses by question (A01, A02, ...) and answer (strongly_agree, agree, ...)
	$.each(surveyQuestions, function(questionIndex, question){
		var questionObject = {};
		var answerCountsObject = {};
		$.each(answers, function(answerIndex, answer){
			answerCountsObject[answer] = 0;
		});
		questionObject[question.name] = answerCountsObject;

		$.each(filteredDataEndline, function(responseIndex, response){
			var thisAnswer = response[question.name];
			questionObject[question.name][thisAnswer] += 1;
		});
		summedResponsesEndline.push(questionObject);
		// summedResponsesEndline = { {A01: {agree:52, agree_strongly:5, disagree:16, ...}},{A02: {agree:56; ...}}, ... }
	});

	graphData();
}

function graphData() {

	// baseline
	// ========
	$.each(summedResponsesBaseline, function(questionIndex, questionObject){
		var questionDivId = '';
		var thisQuestionData = {};

		$.each(questionObject, function(questionIndex, questionData){
			questionDivId = '#' + questionIndex; // "#A01", "#A02", ...
			thisQuestionData = questionData;
		});

		// calculate the percentage for each and add to the div as an html data attr for the tooltip
		$.each(thisQuestionData, function(answerIndex, answerData){
			thisQuestionData[answerIndex] = ( answerData / filteredDataBaseline.length ) * 100;
			var selector = questionDivId + " .response-baseline." + answerIndex;
			var styledPercentage = noDecimal(thisQuestionData[answerIndex]) + "%";
			$(selector).attr("data-percentage", styledPercentage);
		});

		// the viz is overlapping svg rectangle in the same category order
		// calculate each width as its own percentage plus those to the left
		var agree_strongly = thisQuestionData["agree_strongly"];
		thisQuestionData["agree_strongly"] = agree_strongly.toString() + "%";

		var agree = agree_strongly + thisQuestionData["agree"];
		thisQuestionData["agree"] = agree.toString() + "%";

		var neither = agree + thisQuestionData["neither"];
		thisQuestionData["neither"] = neither.toString() + "%";

		var disagree = neither + thisQuestionData["disagree"];
		thisQuestionData["disagree"] = disagree.toString() + "%";

		var disagree_strongly = disagree + thisQuestionData["disagree_strongly"];
		thisQuestionData["disagree_strongly"] = disagree_strongly.toString() + "%";

		var unsure = disagree_strongly + thisQuestionData["unsure"];
		thisQuestionData["unsure"] = unsure.toString() + "%";

		var na = unsure + thisQuestionData["na"];
		thisQuestionData["na"] = na.toString() + "%";

		// use the calculated widths to adjust the rectangles
		$.each(thisQuestionData, function(indexa, responseCategorya){
			var selector = " .response-baseline." + indexa;
			d3.select(questionDivId).select(selector).transition().attr("width", responseCategorya);
		});

	});

	// endline
	// ========
	$.each(summedResponsesEndline, function(questionIndex, questionObject){
		var questionDivId = '';
		var thisQuestionData = {};

		$.each(questionObject, function(questionIndex, questionData){
			questionDivId = '#' + questionIndex; // "#A01", "#A02", ...
			thisQuestionData = questionData;
		});

		// calculate the percentage for each and add to the div as an html data attr for the tooltip
		$.each(thisQuestionData, function(answerIndex, answerData){
			thisQuestionData[answerIndex] = ( answerData / filteredDataEndline.length ) * 100;
			var selector = questionDivId + " .response-endline." + answerIndex;
			var styledPercentage = noDecimal(thisQuestionData[answerIndex]) + "%";
			$(selector).attr("data-percentage", styledPercentage);
		});

		// the viz is overlapping svg rectangle in the same category order
		// calculate each width as its own percentage plus those to the left
		var agree_strongly = thisQuestionData["agree_strongly"];
		thisQuestionData["agree_strongly"] = agree_strongly.toString() + "%";

		var agree = agree_strongly + thisQuestionData["agree"];
		thisQuestionData["agree"] = agree.toString() + "%";

		var neither = agree + thisQuestionData["neither"];
		thisQuestionData["neither"] = neither.toString() + "%";

		var disagree = neither + thisQuestionData["disagree"];
		thisQuestionData["disagree"] = disagree.toString() + "%";

		var disagree_strongly = disagree + thisQuestionData["disagree_strongly"];
		thisQuestionData["disagree_strongly"] = disagree_strongly.toString() + "%";

		var unsure = disagree_strongly + thisQuestionData["unsure"];
		thisQuestionData["unsure"] = unsure.toString() + "%";

		var na = unsure + thisQuestionData["na"];
		thisQuestionData["na"] = na.toString() + "%";

		// use the calculated widths to adjust the rectangles
		$.each(thisQuestionData, function(indexa, responseCategorya){
			var selector = " .response-endline." + indexa;
			d3.select(questionDivId).select(selector).transition().attr("width", responseCategorya);
		});

	});

	d3.selectAll(".response-bar").on("mouseover", function(d){
		var tooltipText = $(this).attr("data-percentage");
		$('#tooltip').append(tooltipText);
	}).on("mouseout", function(){
        $('#tooltip').empty();
    });
	$(".response-bar").mouseover(function(e) {
        //Set the X and Y axis of the tooltip
        $('#tooltip').css('top', e.pageY  );
        $('#tooltip').css('left', e.pageX + 20 );
    }).mousemove(function(e) {
        //Keep changing the X and Y axis for the tooltip, thus, the tooltip move along with the mouse
        $("#tooltip").css({top:(e.pageY)+"px",left:(e.pageX+20)+"px"});
    });

    $(".loader").fadeOut(400);
}


//start function chain for map
getDataBaseline();
