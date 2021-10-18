/*
 * Magazine sample
*/

var zoom = {min:0.20, max:6.00, step:0.10, value: 1.00};
var previousZoom = 3;
var fitToWindow = false;
var autoMove = false;
var turnSound = new Howl({ 
	src: ['content/audios/turn.mp3'],
});

function updateDepth(book, newPage) {

	var page = book.turn('page'),
		pages = book.turn('pages'),
		depthWidth = 16*Math.min(1, page*2/pages);

		newPage = newPage || page;

	if (newPage>3)
		$('.magazine .p2 .depth').css({
			width: depthWidth,
			left: 20 - depthWidth
		});
	else
		$('.magazine .p2 .depth').css({width: 0});

		depthWidth = 16*Math.min(1, (pages-page)*2/pages);

	if (newPage<pages-3)
		$('.magazine .p11 .depth').css({
			width: depthWidth,
			right: 20 - depthWidth
		});
	else
		$('.magazine .p11 .depth').css({width: 0});

}

function addPage(page, book) {

	var id, pages = book.turn('pages');

	// Create a new element for this page
	var element = $('<div />', {});

	// Add the page to the flipbook
	if (book.turn('addPage', element, page)) {

		// Add the initial HTML
		// It will contain a loader indicator and a gradient
		element.html('<div class="gradient"></div><div class="loader"></div>');

		// Load the page
		loadPage(page, element);
	}

}

function loadPage(page, pageElement) {

	// Create an image element

	var img = $('<img />');

	img.mousedown(function(e) {
		e.preventDefault();
	});

	img.load(function() {
		
		// Set the size
		$(this).css({width: '100%', height: '100%'});

		// Add the image to the page after loaded

		$(this).appendTo(pageElement);

		// Remove the loader indicator
		
		pageElement.find('.loader').remove();
	});

	// Load the page

	img.attr('src', 'content/small/page' +  page + '.jpg');

	loadRegions(page, pageElement);

}

// Zoom in / Zoom out

function zoomTo(event) {
		fitToWindow = false;
		//console.log(previousZoom, zoom.value);
		setTimeout(function() {
			if ($('.magazine-viewport').data().regionClicked) {
				$('.magazine-viewport').data().regionClicked = false;
			} else {
				 if (previousZoom == zoom.value) {						
					zoom.value = 1;
					$('.magazine').turn('zoom', zoom.value);	
					$("#zoomSlider").slider("option", "value", zoom.value);
					setViewPosition();
				} else if (zoom.value != previousZoom) {
					zoom.value = previousZoom;
					$('.magazine').turn('zoom', zoom.value);	
					$("#zoomSlider").slider("option", "value", zoom.value);
					setViewPosition();
				}				
			}
		}, 1);

}



// Load regions

function loadRegions(page, element) {

	$.getJSON('content/json/'+page+'-regions.json').
		done(function(data) {

			$.each(data, function(key, region) {
				addRegion(region, element);
			});
		});
}

// Add region

function addRegion(region, pageElement) {
	
	var reg = $('<div />', {'class': 'region  ' + region['class'],'title':'Audio button'}),
		options = $('.magazine').turn('options'),
		pageWidth = options.width/2,
		pageHeight = options.height;

	reg.css({
		top: Math.round(region.y/pageHeight*100)+'%',
		left: Math.round(region.x/pageWidth*100)+'%',
		width: Math.round(region.width/pageWidth*100)+'%',
		height: Math.round(region.height/pageHeight*100)+'%'
	}).attr('region-data', $.param(region.data||''));


	reg.appendTo(pageElement);
}

// Process click on a region

function regionClick(event) {
	var region = $(event.target);
	$(".region").removeClass("play-audio-hover");
	if (region.hasClass('region')) {
		region.addClass("play-audio-hover");
		$('.magazine-viewport').data().regionClicked = true;
		
		setTimeout(function() {
			$('.magazine-viewport').data().regionClicked = false;
		}, 100);
		
		var regionType = $.trim(region.attr('class').replace('region', ''));
		return processRegion(region, regionType);
	}

}

// Process the data of every region

function processRegion(region, regionType) {
	data = decodeParams(region.attr('region-data'));
	$('#jp_container_1').show();
	switch (regionType) {
		case 'link' :

			window.open(data.url);

		break;
		case 'zoom' :
			
			var regionOffset = region.offset(),
				viewportOffset = $('.magazine-viewport').offset(),
				pos = {
					x: regionOffset.left-viewportOffset.left,
					y: regionOffset.top-viewportOffset.top
				};
			console.log(pos)
			$('.magazine-viewport').zoom('zoomIn', pos);

		break;
		case 'to-page' :

			$('.magazine').turn('page', data.page);

		break;
		case 'play-audio play-audio-hover' :			
			$("#jquery_jplayer_1").jPlayer("setMedia", {mp3: data.audio}).jPlayer("play");
		break;
	}

}

// Load large page

function loadLargePage(page, pageElement) {
	
	var img = $('<img />');

	img.load(function() {

		var prevImg = pageElement.find('img');
		$(this).css({width: '100%', height: '100%'});
		$(this).appendTo(pageElement);
		prevImg.remove();
		
	});

	// Loadnew page
	
	img.attr('src', 'content/large/page' +  page + '.jpg');
}

// Load small page

function loadSmallPage(page, pageElement) {
	
	var img = pageElement.find('img');

	img.css({width: '100%', height: '100%'});

	img.unbind('load');
	// Loadnew page

	img.attr('src', 'content/small/page' +  page + '.jpg');
}

// http://code.google.com/p/chromium/issues/detail?id=128488

function isChrome() {

	return navigator.userAgent.indexOf('Chrome')!=-1;

}

function disableControls(page) {
		if (page==1){
			$('.nav-back').addClass('disabled');
			$('.nav-backward').addClass('disabled');
			$('.previous-button').addClass('disabled');
		}
		else{
			$('.nav-back').removeClass('disabled');
			$('.nav-backward').removeClass('disabled');
			$('.previous-button').removeClass('disabled');
		}
					
		if (page==$('.magazine').turn('pages')){
			$('.nav-next').addClass('disabled');
			$('.nav-forward').addClass('disabled');
			$('.next-button').addClass('disabled');
		}
		else{
			$('.nav-next').removeClass('disabled');
			$('.nav-forward').removeClass('disabled');
			$('.next-button').removeClass('disabled');
		}

}

// Set the x and y for the viewport on zoom in and out

function setViewPosition() {
	var width = $('.magazine').width(),
		height = $('.magazine').height();
	var book = $('.magazine'),
		currentPage = book.turn('page'),
		pages = book.turn('pages');
	//console.log(event.pageX)
	
	if(fitToWindow){
		if (currentPage==1 || currentPage==pages){
			console.log(width)
			$('.magazine').css({
				left: -width/2, 
				top: (-height/2)-35,
				transition: "none",
				transform: "none"
			});
		}else{
			console.log(width)
			$('.magazine').css({
				left: -width/4, 
				top: (-height/2)-35,
				transition: "none",
				transform: "none"
			});
		}
	}else{
		$('.magazine').css({
			left: -width/2, 
			top: (-height/2)-35,
			transition: "none",
			transform: "none"
		});
	}
	makeMagazineDraggable();
	makeMagazineAutoMove();
	if(zoom.value == 1){
		$('.previous-button').hide();
		$('.next-button').hide();				
	}else{
		$('.previous-button').show();
		$('.next-button').show();		
	}
	
	$("#zoomSlider .ui-slider-handle").attr('title', zoom.value);	

}

// Set the width and height for the viewport

function resizeViewport() {

	var width = $(window).width(),
		height = $(window).height(),
		options = $('.magazine').turn('options');

	//$('.magazine').removeClass('animated');

	$('.magazine-viewport').css({
		width: width,
		height: height
	}).
	zoom('resize');


	if ($('.magazine').turn('zoom')==1) {
		var bound = calculateBound({
			width: options.width,
			height: options.height,
			boundWidth: Math.min(options.width, width),
			boundHeight: Math.min(options.height, height)
		});

		if (bound.width%2!==0)
			bound.width-=1;

			
		if (bound.width!=$('.magazine').width() || bound.height!=$('.magazine').height()) {

			$('.magazine').turn('size', bound.width, bound.height);

			if ($('.magazine').turn('page')==1)
				$('.magazine').turn('peel', 'br');

			//$('.nav-next').css({height: bound.height, backgroundPosition: '-38px '+(bound.height/2-32/2)+'px'});
			//$('.nav-back').css({height: bound.height, backgroundPosition: '-4px '+(bound.height/2-32/2)+'px'});
		}

		$('.magazine').css({top: (-bound.height/2)-30, left: -bound.width/2});
	}

	var magazineOffset = $('.magazine').offset(),
		boundH = height - magazineOffset.top - $('.magazine').height(),
		marginTop = (boundH - $('.thumbnails > div').height()) / 2;

	if (marginTop<0) {
		$('.thumbnails').css({height:1});
	} else {
		$('.thumbnails').css({height: boundH});
		$('.thumbnails > div').css({marginTop: marginTop});
	}

	if (magazineOffset.top<$('.made').height())
		$('.made').hide();
	else
		$('.made').show();

	//$('.magazine').addClass('animated');
	
}


// Number of views in a flipbook

function numberOfViews(book) {
	return book.turn('pages') / 2 + 1;
}

// Current view in a flipbook

function getViewNumber(book, page) {
	return parseInt((page || book.turn('page'))/2 + 1, 10);
}

function moveBar(yes) {
	if (Modernizr && Modernizr.csstransforms) {
		$('#slider .ui-slider-handle').css({zIndex: yes ? -1 : 10000});
	}
}

function setPreview(view) {

	var previewWidth = 112,
		previewHeight = 73,
		previewSrc = 'content/preview.jpg',
		preview = $(_thumbPreview.children(':first')),
		numPages = (view==1 || view==$('#slider').slider('option', 'max')) ? 1 : 2,
		width = (numPages==1) ? previewWidth/2 : previewWidth;

	_thumbPreview.
		addClass('no-transition').
		css({width: width + 15,
			height: previewHeight + 15,
			top: -previewHeight - 30,
			left: ($($('#slider').children(':first')).width() - width - 15)/2
		});

	preview.css({
		width: width,
		height: previewHeight
	});

	if (preview.css('background-image')==='' ||
		preview.css('background-image')=='none') {

		preview.css({backgroundImage: 'url(' + previewSrc + ')'});

		setTimeout(function(){
			_thumbPreview.removeClass('no-transition');
		}, 0);

	}

	preview.css({backgroundPosition:
		'0px -'+((view-1)*previewHeight)+'px'
	});
}

// Width of the flipbook when zoomed in

function largeMagazineWidth() {
	
	return 2214;

}

// decode URL Parameters

function decodeParams(data) {

	var parts = data.split('&'), d, obj = {};

	for (var i =0; i<parts.length; i++) {
		d = parts[i].split('=');
		obj[decodeURIComponent(d[0])] = decodeURIComponent(d[1]);
	}

	return obj;
}

// Calculate the width and height of a square within another square

function calculateBound(d) {
	
	var bound = {width: d.width, height: d.height};

	if (bound.width>d.boundWidth || bound.height>d.boundHeight) {
		
		var rel = bound.width/bound.height;

		if (d.boundWidth/rel>d.boundHeight && d.boundHeight*rel<=d.boundWidth) {
			
			bound.width = Math.round(d.boundHeight*rel);
			bound.height = d.boundHeight;

		} else {
			
			bound.width = d.boundWidth;
			bound.height = Math.round(d.boundWidth/rel);
		
		}
	}
		
	return bound;
}

//
function onPageCounter(e){
	//console.log(e.type);
	var val = $("#pageCounter").val();
	if(e.type=="click"){
		$("#pageCounter").val("");
		$(".nav-arrow").show();
	} else if(e.type=="input"){
		if (!val.match(/^[+-]?[\d]{0,}$/)){
			$("#pageCounter").val("");
		}
	}    
}

function updatePageCounter(){
	var totalPages = $('.magazine').turn('pages')
	var currentPage = $(".magazine").turn("view");

	for(i=0; i<currentPage.length; i++){		
		if(currentPage[i] == 0){
			currentPage.splice(i,1);
			//console.log(currentPage);
			$("#pageCounter").val(currentPage+" / "+totalPages);
		}else{
			var currentPageDouble = currentPage.join(" - ");
			//console.log(currentPageDouble);
			$("#pageCounter").val(currentPageDouble+" / "+totalPages);			
		}
	}

	$(".nav-arrow").hide();
}

function makeMagazineDraggable(){	
	var book = $('.magazine'),
		currentPage = book.turn('page'),
		pages = book.turn('pages');
	var width = $(window).width(),
		height = $(window).height()-70,
		magWidth = $(".magazine").width(),
		magHeight = $(".magazine").height();

	if (currentPage==1 || currentPage==pages){
		magWidth = $(".magazine").width()/2;
	}

	var x1 = magWidth-width,
		y1 = magHeight-height,
		x2 = 0,
		y2 = 0;	

	
	if (currentPage==1 || currentPage==pages){
		x1 = magWidth-(width/2);
		x2 = -(magWidth/2);
	}
	//console.log(x1);
	$(".magazine").draggable({scroll: false});

	if(zoom.value > 1 && !autoMove){		
		$('.magazine').css({
			cursor: "pointer"			
		});
		$(".magazine").removeAttr('title');
		if(magWidth < width && magHeight > height){			
			$(".magazine").draggable({scroll: false, axis: "y", containment: [-x1,-y1,x2,y2]});
		}else if(magWidth > width && magHeight < height){			
			$(".magazine").draggable({scroll: false, axis: "x", containment: [-x1,-y1,x2,y2]});
		}else if(magWidth > width && magHeight > height){			
			$(".magazine").draggable({scroll: false, axis: false, containment: [-x1,-y1,x2,y2]});
		}else{
			$('.magazine').css({
				cursor: "default"			
			});
			$(".magazine").draggable("destroy");
			$(".magazine").attr('title','Click or Drag to Zoom');
		}		
	}else{		
		$('.magazine').css({
			cursor: "default"			
		});
		$(".magazine").draggable("destroy");
		$(".magazine").attr('title','Click or Drag to Zoom');
	}
}

function makeMagazineAutoMove(){
	var width = $(window).width(),
		height = $(window).height();
	var x1 = $(".magazine").width()-width,
		y1 = ($(".magazine").height()-height)+70,
		x2 = 0,
		y2 = 0;
	if(zoom.value > 1 && autoMove){
		$('.magazine-viewport').bind($.mouseEvents.move, function(event) {
			if(event.pageX < $(window).width()/2){
				if($(".magazine").offset().left < 0){
					console.log("pageX:: ",event.pageX);
					/* $('.magazine').css({
						left: 		
					}); */
				}
			}else if(event.pageX > $(window).width()/2){
				console.log("pageX:: ",event.pageX);
			}			
			console.log("pageX:: ",event.pageX);
			console.log("pageY:: ",event.pageY);
			/* console.log("height:: ",$(window).height());
			console.log("width:: ",$(window).width()); */
		});
		// $(".magazine").draggable("disable");
	}else{
		$('.magazine-viewport').unbind($.mouseEvents.move);
		// $(".magazine").draggable("enable");
	}
	makeMagazineDraggable()
}