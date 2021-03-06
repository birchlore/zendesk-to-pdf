var fs = require('fs');

var http = require('http');
var https = require('https');
var request = require('request');
var zendesk = require('node-zendesk');
var exec = require('child_process').exec;
var util = require('util');
var pdf = require('html-pdf');

var category_id = 203290327;      // replace with your category_id

var zenClient = zendesk.createClient({
	username:  'mnyemail@myemail.com',
	token:     'mytoken',
	remoteUri: 'https://myurl.zendesk.com/api/v2/help_center',
    helpcenter: true
});

var articles = {},
	sections = {},
	htmlOutput = '<style type="text/css"> @font-face {font-family:"regular";src: url("/font/HelveticaLTStd-Roman_gdi.eot");src: url("/font/HelveticaLTStd-Roman_gdi.eot?#iefix") format("embedded-opentype"),url("/font/HelveticaLTStd-Roman_gdi.woff") format("woff"),url("/font/HelveticaLTStd-Roman_gdi.ttf") format("truetype"),url("/font/HelveticaLTStd-Roman_gdi.svg#HelveticaLTStd-Roman") format("svg");font-weight: 200;font-style: normal;font-stretch: normal;unicode-range: U+0020-25CA;}body{font-size: 11px; line-height: 14px; font-family: "Lucida Sans Unicode", "Lucida Grande", sans-serif;} img{max-width: 500px;} .page-break{ display: block; page-break-before: always; }</style>'
	+ '<img style="float: right; width 200px; height: 200px; margin-bottom: 20px; margin-top: 50px;" src="https://p6.zdassets.com/hc/theme_assets/1073225/200309248/zenQMS_logo_ekelly_PNG_square.png">'
	+ '<p style="clear: both;"><h1 style="float:right; font-size: 38px;">User Guide</h1></p>'
	+ '<div style="height: 100px;"></div>'
	+ '<p style="clear: both;">This User Guide was generated directly from the online ZenQMS Knowledgebase. Please visit the support section for the latest articles, related video tutorials and product announcements. </p>'
	+ '<div style="height: 100px;"></div>'
	+ '<p style="font-weight: 600;">STATEMENT OF OWNERSHIP</p>'
	+ '<p>ZenQMS has prepared this document for existing/potential clients to use solely as a training manual.  The information contained in this document is proprietary.  In no event shall all or any portion of this document be distributed, published or in any way disseminated for any other purpose without the expressed written permission of ZenQMS. </p>'
	+ '<p>Copyright © 2016 ZenQMS LLC. All Rights Reserved.</p></div>'
	+ '<div class="page-break"></div>';
var options = { 
	format: 'Letter', 
	timeout: 100000,
	border: {
	    top: '0.7in',            // default is 0, units: mm, cm, in, px
	    right: '0.3in',
	    bottom: '0.5in',
	    left: '0.3in'
  	},
  	header: {
	    height: '0mm',
	    contents: ''
	 },
  	quality: 200,
  	footer: {
	    height: '0mm',
	    contents: ''
	  },
	footer: {
		height: "0.2in",
		contents: {
		  default: '<span style="color: #444; float: right;">{{page}}</span>', // fallback value
		}
	},
 
};

getSections();

function getArticles(){
	zenClient.articles.listByCategory(category_id, function(err, request, result){
		for (var i = 0; i < result.length; i++) {
			
			var sec = sections.find(function(index){
				return index.id === result[i].section_id;
			});

			if(articles[sec.name] == null){
				articles[sec.name] = [];
			}
			
			articles[sec.name].push({
				title: result[i].title,
				body: result[i].body,
			});
		}
		generateHTML();
	});
}

function getSections(){
	zenClient.sections.list(function(err, request, result){
		sections = result;
	});
	getArticles();
}

function generateHTML(){
	var headers = '<div style="page-break-before:always;">',
		body = "",
		j = 1;
	
	for(key in articles){
		headers += util.format('<div style="color: rgb(88, 154, 214); ">%s.0 %s</div>', j, key);
		body += util.format('<h2>%s.0 %s</h2>', j, key);
		for (var i = 0; i < articles[key].length; i++) {
			var headIndex = i.toString();
			if(headIndex.length < 2) headIndex = '0' + headIndex;
			headers += util.format('<div>%s.%s %s</div>', j, headIndex ,articles[key][i].title);
			body += util.format('<h3>%s.%s %s</h3>', j, headIndex,  articles[key][i].title);
			body +=  articles[key][i].body;
			body += '<br>';
		}
		j++;
	}
	
	headers += '</div>';
	headers += '<div class="page-break"></div>';
	htmlOutput += headers + body;
	createPDFFile(htmlOutput);
}

function createPDFFile(){
	pdf.create(htmlOutput, options).toFile('./userKnowledge.pdf', function(err, res) {
	  if (err) return console.log(err);
	  console.log(res); // { filename: '/app/businesscard.pdf' }
	});
}

function createHTMLFile(){
	fs.writeFile('test.html', htmlOutput, function(err) {
		if(err) {
			//console.log(err);
			throw err;
		} else {
			console.log("written into file");
		}
	});
}
