"use strict";

var G_selected_view_id;
var G_page_view;
var G_page_view_definition;
var G_DocTable;
var G_selected_page;
var G_selected_doc;
var G_last_selected_doc;

var G_sheet_data;

/**************************************************************/
/* set_sheet_data called to send sheet data from host initially */
/**************************************************************/

function set_sheet_data(sheet_data)
{
  console.log (sheet_data);
  G_sheet_data = sheet_data;
}   

// initialization from html
function startjs ()
{
	// enable the root nav
	var template = $("#T-root-structure").html();
	$("div.root-div").html(_.template(template,{}));
	
	$(".warning").hide();
	
	// set up the body for the main operation panel
	//document.getElementsByTagName('body')[0].style = 		 
	//"font-family: Arial, Helvetica, sans-serif;" + 
	//"color: #555;" + 
	//"background: #ffffff url('http://www.hurrec.org.uk/committee/images/bg-body.gif') top left repeat-y;" + 
	//"font-size: 12px"; 

	// setup view and command buttom animation
	$(".func-nav-list li a.current").parent().find("ul").slideToggle("slow");
	$(".func-nav-list li a.nav-top-item").click(function(){$(this).parent().siblings().find("ul").slideUp("normal");$(this).next().slideToggle("normal");return false;});
	$(".func-nav-list li a.no-submenu").click(function(){window.location.href=(this.href);return false;});
	$(".func-nav-list li .nav-top-item").hover(function(){$(this).stop().animate({paddingRight:"25px"},200);},function(){$(this).stop().animate({paddingRight:"15px"});});

	$(".cmd-nav-list li a.current").parent().find("ul").slideToggle("slow");
	$(".cmd-nav-list li a.nav-top-item").click(function(){$(this).parent().siblings().find("ul").slideUp("normal");$(this).next().slideToggle("normal");return false;});
	$(".cmd-nav-list li a.no-submenu").click(function(){window.location.href=(this.href);return false;});
	$(".cmd-nav-list li .nav-top-item").hover(function(){$(this).stop().animate({paddingRight:"25px"},200);},function(){$(this).stop().animate({paddingRight:"15px"});});

	// init all views
	G_page_view = new G_page_view_definition();

	G_page_view.render(1)
	return;
}

// common switch view handler
function switch_view (n)
{
	G_page_view.render(n);
}

// command process click handler	   
function process_click (func)
{
	G_page_view.doFunction(func);	
}

//---------------
//   PAGE VIEW 
//---------------

G_page_view_definition = Backbone.View.extend(
{   
    // initialize
    initialize: function () 
    {
        _.bindAll(this, 'render', 'doFunction'); 
        this.on('doFunction', this.doFunction, this);
    }, 
      
    // render   
   	render: function (page) 
    {		
    	G_selected_page = page;
    	
    	// change status of view button 
    	if (G_selected_view_id!=null)
    	{
		   $(G_selected_view_id).addClass('nav-top-item').removeClass('nav-selected-item');
    	}
    	var theid = "#id-page-" + page.toString();
    	$(theid).addClass('nav-selected-item').removeClass('nav-top-item');
		G_selected_view_id = theid;
		
		$("#id_logoff_command").show()
		$("#id_command_view").hide();
		$("#id_command_download").hide();
		
		// update the content
		var templ = "T-Page-Content-" + page.toString();
		var template = $("#" + templ).html();
		$("#content").html(_.template(template,{}));
		
		// render depending upon selected page
		if (G_selected_page==1)
		{
			render_page_1();
		}
		else if (G_selected_page==2)
		{
			render_page_2();
		}
		else
		{
			alert ("render for page not implemented yet");
		}
	},
    
    // dofunction - mouse click entry point from content area.. only logoff for dashboard  
   	doFunction: function (func) 
	{		
		// render depending upon selected page
		if (G_selected_page==1)
		{
			doFunction_page_1 (func);
		}
		else
		{
			alert ("doFunction for page not implemented yet");
		}
    },
    
    // all views need a terminate
    terminate: function()
    {
    	// no action
    },
    
    // remove function to clean up
    remove: function() 
    {
        this.undelegateEvents();
        this.$el.empty();
        this.stopListening();
        return this;
    }
});

//--------------------------------------
// Processing for page 1 (document view)
//--------------------------------------

function render_page_1 ()
{
	var scolumns = [];
	var acolumn = 0;
	
	// do the column headers
	for (var col=0; col<G_DocTable[0].length; col++)
	{
		acolumn = {name: G_DocTable[0][col], title: G_DocTable[0][col]};  
		scolumns.push (acolumn);
	}
	
	// do the rows
	var srows = [];
	for (var row=1; row<G_DocTable.length; row++)
	{    
		var arow = 0;
		var s = "arow = {";
		for (var col=0; col<G_DocTable[0].length; col++)
		{  
			if (col != 0) s = s + ", ";
			s = s + G_DocTable[0][col] + ':"' + G_DocTable[row][col] +  '"' ;
		}
		s = s + "};"
		eval(s);
		srows.push (arow);
	}
		
    // display data
	jQuery(function($){
		$('#doc-table').footable({
			"paging": {"size": 20},
			"toggleColumn": "first",
			"sorting": {"enabled": true},
			"columns": scolumns,
			"rows": srows
		});
	});	
	
	// setup the right click context menu
	$.contextMenu
	({
		selector: '#doc-table', 
		callback: function(key, options, e) 
		{
			if (key=="view")
			{
				doFunction_page_1("view")
			}
			else if (key=="download")
			{
				doFunction_page_1("download")
			}
		},
		items: 
		{
			"view": {name: "View document"},
			"download": {name: "Download document"}, 
			"moveup": {name: "Move document up in table"}, 
			"movedown": {name: "Move document down in table"}
		}        		
    });

	// trigger on left button click in a row for single document
	$('#doc-table').find('tr').click( function(e)
	{
	    // set selected team
		G_selected_doc = ($(this).find('td:first').text());

		// if we had a last selected team, set it to white
		if (G_last_selected_doc!="")
		{
			set_table_row(G_last_selected_doc, 'white');
			G_last_selected_doc = "";	
		}

		// if we have a new selected team, set it to aqua
		if (G_selected_doc!="")
		{
			set_table_row(G_selected_doc, 'aqua');
			G_last_selected_doc = G_selected_doc;	
		}
		
		// hide or show view/download buttons
		if (G_selected_doc!="")
		{
			$("#id_command_view").show();
			$("#id_command_download").show();
			$("#id_command_view").html("View doc with ID " + G_selected_doc);
			$("#id_command_download").html("Download doc with ID " + G_selected_doc);
		}
		else
		{
			$("#id_command_view").hide();
			$("#id_command_download").hide();
		}	
	});
}

// set the table row for a team to a background colour
function set_table_row (id, colour)
{
	$('#doc-table tr').each(function (row)
	{
		 if (($(this).find('td:first').text())==id)
		 {
		 	$(this).css('background',colour);
		 	return;
		 }
	});
}
	
// doFunction for page 1	
function doFunction_page_1(func)
{
	// view function
    if (func=="view")
    {
    	window.open ("http://hurrec.org.uk/committee/docs/2019-Trips-Paper.pdf");
    }
    
    // download function
    else if (func=="download")
    {
     	file_get_contents ("http://hurrec.org.uk/committee/docs/2019-Trips-Paper.pdf", download_document_loaded, download_document_error);
    }
    else
    {
   		alert ("Unimplemented function for page 1"); 
    }
}	
   
function download_document_error (result)
{
	alert ("Error loading document file : " + result);
}
   
   
function download_document_loaded(result)
{
  	var blob = new Blob(result, {type: "application/pdf"});
	saveAs(blob, "file.pdf");
}

//-------------------------------
//render page 2 (upload document)
//-------------------------------

function render_page_2 ()
{
	// trigger on file input
	$("#upload-file-input").change(function(evt)
	{	
		// Retrieve the first (and only!) File from the FileList object
    	var file = evt.target.files[0]; 
    	var upload_filename = evt.target.files[0].name;

    	if (file=="") 
    	{	
    		alert ("problem uploading file");
    		return;
    	}
    	
    	// open file
		var r = new FileReader();
		r.readAsText(file);

		// function called when file loaded
		r.onload = function(e) 
		{ 
			// create the array 
			var arr = {};
			arr['function'] = "file_get_contents";
			arr['contents'] = e.target.result;
			arr['filename'] = 'hurrecdocs.csv';
			
			console.log (JSON.stringify(arr));
			 
			let fetchdata = 
			{
        		method: 'POST',
        		headers: 
        		{
        			"Content-Type": "application/json"
        		},
        		body: JSON.stringify(arr)
        	};
			 
    		fetch("process.php", fetchdata)
    		.then((resp) => resp.json())
    		.then (function(data) { ron1(data); })  
		}	
	});
}

function ron1 (resp)
{
	console.log(resp.filename) ;
	console.log(resp.content) ;
}

//-------------------
// file_get_contents 
//-------------------

var file_get_contents_cb_ok_save;
var file_get_contents_cb_error_save;

function file_get_contents (filename, ok_callback, error_callback)
{
	console.log ("file_get_contents called " + filename);
	
	// save the callback
	file_get_contents_cb_ok_save = ok_callback;
	file_get_contents_cb_error_save = error_callback;

	// create the array 
	var arr = {};
	arr['function'] = "file_get_contents";
	arr['filename'] = filename;
	
	// issue the POST
	let fetchdata = 
	{
		method: 'POST',
		headers: 
		{
			"Content-Type": "application/json"
		},
		body: JSON.stringify(arr)
	};
	 
	fetch("process.php", fetchdata)
	.then((resp) => resp.json())
	.then (function(response) { file_get_contents_continue (response); })  	
}

function file_get_contents_continue (response)
{
	if (response.success==false)
	{
		console.log ("file_get_contents returned with error " + response.result);
		file_get_contents_cb_error_save(response.result);
		return;
	}
	console.log ("file_get_contents returned OK " + response.result.length + " bytes");
	file_get_contents_cb_ok_save(response.result);
}





