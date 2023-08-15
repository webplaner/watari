// http abs path (i.e. http://mydomain.com)
var baseURL = "";
// Path to images
var dd_imgPath = "./images/drawing_pad";
// Display alert on object load if there's 'toDataURL' support. false = show onclick of submit
var dd_noDataURLOnLoad = false;
// Save button ID; if it doesn't already exist, it will be created
var dd_objSaveButton = "dd_saveButton";
// Save button name
var dd_objSaveButtonName = "그림 저장하기";
// Drawing output to image file name
var dd_outputFileName = "mysig";
// Data processor location file + path
var dd_dataProcessURL = "drawing_pad_process.php";
// Do an action 'AFTER' saving drawing (exporting to image)
var dd_doPostAction = {
    dataSaved: function (f) {
        
        // Add your code here. The 'f' var is the filename passed back
        
        // This line is for testing purposes and can be removed
        // along with the function it calls
        drawing_postSaveAction(f);
    }
};
var dd_callbacks = {
    
    submit: function (t) {
        
        // Add your code here; i.e. function, statements, etc
    }
    
};
// Canvas element options
var dd_baseCanvas = {
    'format': 'png', // Final output format for converting to *DO NOT CHANGE AS IT CURRENTLY ONLY SUPPORTS PNG
    'width': 460, // Canvas html width (not css width)
    'height': 320, // Canvas html height (not css width)
    'border': 'solid 1px #c0c0c0', // CSS notation; i.e. 'solid 1px #c0c0c0'
    'bg': '#ffffff', // CSS notation
    'linewidth': 2, // Drawing line thickness (caution: in webkit browser, if setting this to 1, set shadowblur to 0)
    'color': '#000000', // Drawing line color
    'shadowcolor': '#000000', // Drawing line shadow color
    'shadowblur': 2, // Drawing line shadow shadow blur (FF browsers)
    'shadowblur_wk': 2, // Drawing line shadow shadow blur (Webkit)
    'shadowblur_ie': 2 // Drawing line shadow shadow blur (IE)
};
// Various jscript alert notices
var dd_alert = {
    // If no html5 support
    'nohtml5': 'Your device does not yet support some important features of HTML5.',
    // If html5 suppport but no export to image support (toDataURL)
    'nodataurl': 'Your device does not support exporting drawing to image.',
    // If submitting without drawing
    'nosig': 'Please add your drawing first',
    // If drawing could not be saved
    'savefail': 'I could not save your drawing. Please try again.'
}
// Enable or Disable tools
var dd_allowTools = {
    'picker': false
    , 'pencil': true
    , 'undo': false
    , 'delete': false
};
// Position of pencil picker display;
var dd_pencilPicker_show = "left";
// Position of color picker display;
var dd_colorPicker_show = "left";
// Color pallete colors
var dd_colors = new Array(
    '000000', '993300', '333300', '000080', '333399', '333333', '800000', 'FF6600', '808000', '008000', '008080', '0000FF', '666699', '808080', 'FF0000', 'FF9900', '99CC00', '339966', '33CCCC', '3366FF', '800080', '999999', 'FF00FF', 'FFCC00', 'FFFF00', '00FF00', '00FFFF', '00CCFF', '993366', 'C0C0C0', 'FF99CC', 'FFCC99', 'FFFF99', 'CCFFFF', '99CCFF', 'FFFFFF'
);
// Default cursor position (draw position) for Google Chrome
var dd_webkitCursorOffset = "20 25";
// 'Draw' the drawing area drawing to an existing element on page
var dd_print2Element = '';
/**
 * ------------------------------------
 * End of Customizable Settings
 * ------------------------------------
 */

/**
 * Defined Variables (do not modify these)
 */
var dd_toDataURLExist = false;
var dd_drawingStarted = false;
var dd_drawnLines = new Array();
var dd_drawnPoint = 0;
/**
 * Let's load in all our functions, methods, vars and more
 */
var dd_buildStructure = function () {
    var wrapper = document.getElementById('drawing_padWrapper');
    if (!wrapper) {
        alert('Error!!\nYou are missing the Div Element: \'drawing_padWrapper\'');
        return
    }
    var objCanvas = document.createElement('canvas');
    with(objCanvas) {
        setAttribute('id', 'dd_canvas');
        setAttribute('width', dd_baseCanvas['width']);
        setAttribute('height', dd_baseCanvas['height']);
        with(style) {
            display = "inline-block";
            border = dd_baseCanvas['border'];
            backgroundColor = dd_baseCanvas['bg']
        }
    }
    
    function checkFunctions(o) {
        var data = o.toDataURL("image/png");
        return {
            'html5': (!o.getContext ? false : true)
            , 'todataurl': (data.indexOf("data:image/png") != -1 ? true : false)
        }
    };
    var checks = checkFunctions(objCanvas);
    if (checks['html5'] == false) {
        alert(dd_alert['nohtml5']);
        return
    } else if (checks['todataurl'] == true) {
        dd_toDataURLExist = true
    } else if (checks['todataurl'] == false) {
        if (dd_noDataURLOnLoad == true) {
            alert(dd_alert['nodataurl']);
            return
        }
    }
    
    const iconWrapper = document.createElement('div');
    with(iconWrapper) {
        setAttribute('id', 'dd_drawingToolWrapper');
        with(style) {
            position = "relative";
            if (!dd_allowTools['picker'] && !dd_allowTools['pencil'] && !dd_allowTools['undo'] && !dd_allowTools['delete']) {
                display = "none"
            } else {
                display = "inline-block"
            }

            width = "100%"; //"74px";
            padding = "10px";
            // marginLeft = "2px";
            textAlign = "center"; //"left"
        }
    }

    const iconPencilPicker = document.createElement('img');
    with(iconPencilPicker) {
        setAttribute('id', 'dd_tool_pencilPicker');
        setAttribute('src', baseURL + dd_imgPath + '/icon_pencil_picker.png');
        setAttribute('title', 'Change Pencil Thickness');
        addEventListener('click', function (event) {
            dd_showPencilPicker(this, event)
        }, false);
        if (!dd_allowTools['pencil']) {
            style.display = "none"
        }
    }


    var objPencilPicker = document.createElement('div');
    objPencilPicker.setAttribute('id', 'dd_pencilPicker');
    with(objPencilPicker.style) {
        position = "absolute";
        display = "none";
        width = "100px";
        height = "auto";
        textAlign = "left";
        padding = "2px 0px 2px 2px";
        color = "inherit";
        backgroundColor = "#ffffff";
        border = "solid 1px #c0c0c0";
        borderRadius = "3pt";
        boxShadow = "0pt 0pt 1pt #808080";
        zIndex = "99"
    }
    var pencilOptions = {
        'Thin': 'pencil_option_1.png'
        , 'Normal': 'pencil_option_2.png'
        , 'Thick': 'pencil_option_3.png'
    };
    for (var p in pencilOptions) {
        var pen = document.createElement('img');
        pen.setAttribute('src', baseURL + dd_imgPath + '/' + pencilOptions[p]);
        pen.setAttribute('title', p);
        with(pen.style) {
            border = "solid 1px #ffffff"
        }
        pen.addEventListener('mouseover', function (event) {
            this.style.cursor = "pointer";
            this.style.border = "solid 1px #00ff00"
        }, false);
        pen.addEventListener('mouseout', function (event) {
            this.style.cursor = "auto";
            this.style.border = "solid 1px #ffffff"
        }, false);
        pen.addEventListener('click', function (event) {
            dd_canvasFormat(this, 'line', objCanvas)
        }, false);
        objPencilPicker.appendChild(pen)
    }
    var iconColorPicker = document.createElement('img');
    with(iconColorPicker) {
        setAttribute('id', 'dd_tool_colorPicker');
        setAttribute('src', baseURL + dd_imgPath + '/pencil.png');
        // setAttribute('src', baseURL + dd_imgPath + '/icon_color_picker.png');
        setAttribute('title', 'Change Drawing Color');
        addEventListener('click', function (event) {
            dd_showColorPicker(this, event)
        }, false);
        if (!dd_allowTools['picker']) {
            style.display = "none"
        }
    }
    window.addEventListener('click', function (event) {
        dd_hidePickers(this, event)
    }, false);
    var objPicker = document.createElement('div');
    objPicker.setAttribute('id', 'dd_colorPicker');
    with(objPicker.style) {
        position = "absolute";
        display = "none";
        width = "155px";
        height = "auto";
        textAlign = "left";
        padding = "2px 0px 2px 2px";
        color = "inherit";
        backgroundColor = "#ffffff";
        border = "solid 1px #c0c0c0";
        borderRadius = "3pt";
        boxShadow = "0pt 0pt 1pt #808080";
        zIndex = "99"
    }
    for (var p = 0; p < dd_colors.length; p++) {
        var col = document.createElement('div');
        with(col) {
            setAttribute('id', 'dd_color_' + dd_colors[p]);
            setAttribute('color', dd_colors[p]);
            with(style) {
                position = "relative";
                display = "inline-block";
                width = "15px";
                height = "15px";
                margin = "1px";
                border = "solid 1px #000000";
                backgroundColor = "#" + dd_colors[p]
            }
            addEventListener('mouseover', function (event) {
                this.style.cursor = "pointer";
                this.style.opacity = "0.7"
            }, false);
            addEventListener('mouseout', function (event) {
                this.style.opacity = "1"
            }, false);
            addEventListener('click', function (event) {
                dd_canvasFormat(this, 'color', objCanvas)
            }, false)
        }
        objPicker.appendChild(col)
    }
    var iconErasor = document.createElement('img');
    with(iconErasor) {
        setAttribute('id', 'dd_tool_erasor');
        setAttribute('src', baseURL + dd_imgPath + '/icon_erasor.png');
        setAttribute('title', 'Clear Drawing Pad');
        addEventListener('click', function (event) {
            dd_clearCanvas(this, objCanvas)
        }, false);
        if (!dd_allowTools['delete']) {
            style.display = "none"
        }
    }
    var iconUndo = document.createElement('img');
    with(iconUndo) {
        setAttribute('id', 'dd_tool_undo');
        setAttribute('src', baseURL + dd_imgPath + '/icon_undo.png');
        setAttribute('title', 'Undo Last Line');
        addEventListener('click', function (event) {
            dd_undo(this)
        }, false);
        if (!dd_allowTools['undo']) {
            style.display = "none"
        }
    }
    iconWrapper.appendChild(iconPencilPicker);
    iconWrapper.appendChild(objPencilPicker);
    iconWrapper.appendChild(iconColorPicker);
    iconWrapper.appendChild(objPicker);
    iconWrapper.appendChild(iconUndo);
    iconWrapper.appendChild(iconErasor);

    wrapper.appendChild(iconWrapper);
    wrapper.appendChild(objCanvas);

    var objSaveButton = document.getElementById(dd_objSaveButton);
    if (!objSaveButton) {
        var objSaveButtonWrapper = document.createElement('div');
        with(objSaveButtonWrapper) {
            setAttribute('id', 'dd_objSaveButtonWrapper');
            with(style) {
                position = "relative";
                clear = "both"
            }
        }
        objSaveButton = document.createElement('div');
        with(objSaveButton) {
            setAttribute('id', dd_objSaveButton);
            innerHTML = dd_objSaveButtonName
        }
        objSaveButtonWrapper.appendChild(objSaveButton);
        wrapper.appendChild(objSaveButtonWrapper)
    }
    objSaveButton.addEventListener('click', function (event) {
        dd_saveDrawing(this, event);
        dd_callbacks.submit(this)
    }, false);
    dd_agentWK = (navigator.userAgent.indexOf('AppleWebKit') != -1 ? true : false);
    dd_agentFF = (navigator.userAgent.indexOf('Firefox') != -1 ? true : false);
    dd_agentIE = (navigator.userAgent.indexOf('MSIE') != -1 ? true : false);
    dd_agentIE_10 = (parseFloat(navigator.appVersion.split('MSIE')[1]) == 10 ? true : false);
    dd_agentOP = (navigator.userAgent.indexOf('Opera') != -1 ? true : false);
    dd_iOS_3_0 = (navigator.userAgent.indexOf('OS 3_0') != -1 ? true : false);
    dd_iOS_3_1 = (navigator.userAgent.indexOf('OS 3_1') != -1 ? true : false);
    dd_iOS_3_2 = (navigator.userAgent.indexOf('OS 3_2') != -1 ? true : false);
    if (dd_agentWK) {
        objCanvas.addEventListener('mouseover', function (event) {
            if (navigator.userAgent.indexOf('Chrome/29.0.') != -1) {
                dd_webkitCursorOffset = "7 25"
            }
            objCanvas.style.cursor = "url('" + dd_imgPath + "/pencil.cur') " + dd_webkitCursorOffset + ", auto";
            objCanvas.onselectstart = function (e) {
                return false
            };
            objCanvas.onmousedown = function (e) {
                return false
            }
        })
    }
    
    function dd_clearCanvas(t, o) {
        var canvas = o.getContext('2d');
        canvas.clearRect(0, 0, o.width, o.height);
        dd_drawingStarted = false;
        if (t != "format") {
            dd_drawnLines = new Array();
            dd_drawnPoint = 0
        }
    };
    
    function dd_undo(t) {
        if (dd_drawnLines.length == 0) {
            dd_drawingStarted = false;
            return
        }
        delete dd_drawnLines[dd_drawnLines.length - 1];
        dd_drawnPoint--;
        dd_drawnPoint = (dd_drawnPoint < 0 ? 0 : dd_drawnPoint);
        dd_drawnLines.splice((dd_drawnLines.length - 1), 1);
        dd_canvasFormat('undo', 'color', objCanvas)
    };
    
    function dd_showPencilPicker(t, e) {
        var selfX = t.offsetLeft;
        var selfY = t.offsetTop;
        if (objPencilPicker) {
            with(objPencilPicker.style) {
                switch (dd_pencilPicker_show) {
                case "left":
                    left = (selfX - 80) + "px";
                    top = (selfY + 10) + "px";
                    break;
                case "top-left":
                    left = (selfX - 80) + "px";
                    top = (selfY - 20) + "px";
                    break;
                case "top-right":
                    left = (selfX + 10) + "px";
                    top = (selfY + 20) + "px";
                    break;
                default:
                    left = (selfX + 10) + "px";
                    top = (selfY + 10) + "px"
                }
                display = "block"
            }
        }
    };
    
    function dd_showColorPicker(t, e) {
        var selfX = t.offsetLeft;
        var selfY = t.offsetTop;
        if (objPicker) {
            with(objPicker.style) {
                switch (dd_colorPicker_show) {
                case "left":
                    left = (selfX - 134) + "px";
                    top = (selfY + 10) + "px";
                    break;
                case "top-left":
                    left = (selfX - 134) + "px";
                    bottom = (selfY + 10) + "px";
                    break;
                case "top-right":
                    left = (selfX + 10) + "px";
                    bottom = (selfY + 10) + "px";
                    break;
                default:
                    left = (selfX + 10) + "px";
                    top = (selfY + 10) + "px"
                }
                display = "block"
            }
        }
    };
    
    function dd_hidePickers(t, e) {
        var isID = (e.target ? e.target.id : e.srcElement.id);
        if (isID != "dd_tool_colorPicker") {
            objPicker.style.display = "none"
        }
        if (isID != "dd_tool_pencilPicker") {
            objPencilPicker.style.display = "none"
        }
    };
    
    function dd_canvasFormat(t, a, o) {
        switch (a) {
        case "color":
            var canvas = o.getContext('2d');
            dd_clearCanvas('format', o);
            if (t != "undo") {
                canvas.strokeStyle = "#" + t.getAttribute('color');
                canvas.shadowColor = "#" + t.getAttribute('color')
            }
            canvas.beginPath();
            for (var i = 0; i < dd_drawnLines.length; i++) {
                canvas.beginPath();
                for (var z = 0; z < dd_drawnLines[i]['x'].length; z++) {
                    if (z == 0) {
                        canvas.moveTo(dd_drawnLines[i]['x'][z], dd_drawnLines[i]['y'][z])
                    } else if (dd_drawnLines[i]['x'][z] != "" && dd_drawnLines[i]['y'][z] != "") {
                        canvas.lineTo(dd_drawnLines[i]['x'][z], dd_drawnLines[i]['y'][z]);
                        canvas.stroke()
                    }
                }
            }
            if (dd_drawnLines.length == 0) {
                dd_drawingStarted = false
            } else {
                dd_drawingStarted = true
            }
            break;
        default:
            context = o.getContext('2d');
            if (t.title == "Thin") {
                context.lineWidth = 2
            } else if (t.title == "Normal") {
                context.lineWidth = dd_baseCanvas['linewidth']
            } else {
                context.lineWidth = 4
            }
            if (t.title == "Thin") {
                context.shadowBlur = (dd_agentWK ? 0 : 1)
            } else {
                if (dd_agentIE) {
                    context.shadowBlur = dd_baseCanvas['shadowblur_ie']
                } else if (dd_agentWK) {
                    context.shadowBlur = dd_baseCanvas['shadowblur_wk']
                } else {
                    context.shadowBlur = dd_baseCanvas['shadowblur']
                }
            }
        }
    };
    var dd_xmlTimer = null;
    
    function dd_xmlObject(t, url, params, c, c_args) {
        try {
            rqObj.abort()
        } catch (er) {}
        var rqObj = null;
        if (window.XMLHttpRequest) {
            rqObj = new XMLHttpRequest()
        } else if (window.ActiveXObject) {
            try {
                rqObj = new ActiveXObject("Msxml2.XMLHTTP")
            } catch (er) {
                try {
                    rqObj = new ActiveXObject("Microsoft.XMLHTTP")
                } catch (er) {
                    rqObj = "If you are using Internet Explorer, please enable your ActiveX or update your Internet Explorer to a version that supports it."
                }
            }
        } else {
            rqObj = "Your browser does not support the XMLHttpRequest or ActiveX. To utilize this option, please use a browser with one of the supports."
        }
        if (typeof (t) == "number") {
            dd_xmlTimer = window.setTimeout((function () {
                try {
                    rqObj.abort()
                } catch (er) {}
                if (typeof (c) != null && typeof (c) != undefined && typeof (c) != "") {
                    if (c_args) {
                        c.apply(null, c_args)
                    } else {
                        eval(c)
                    }
                }
            }), t)
        }
        if (url != "" && url != undefined && url != null) {

            // console.log(url);
            // console.log(params.length);

            rqObj.open('POST', url, true);
            rqObj.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            // rqObj.setRequestHeader("Content-Length", params.length);
            // rqObj.setRequestHeader("Connection", "close");
            rqObj.send(params);
            if (typeof (rqObj) != "object") {
                rqObj = "There is a connection issue at this time.\n\nPlease refresh and try again."
            }
        }
        return rqObj
    };
    
    function dd_saveDrawing(t, e) {
        if (!dd_toDataURLExist) {
            alert(dd_alert['nodataurl']);
            return false
        }
        if (!dd_drawingStarted) {
            alert(dd_alert['nosig']);
            return false
        }
        var elementWritable = false;
        if (t.tagName.toLowerCase() != "img" && t.tagName.toLowerCase() != "input" && t.tagName.toLowerCase() != "select" && t.tagName.toLowerCase() != "textarea") {
            t.setAttribute('dd_defaultvalue', t.innerHTML);
            t.innerHTML = "<img src=\"" + dd_imgPath + "/icon_loading_0.gif\" style=\"vertical-align:middle;\" /> Saving...";
            elementWritable = true
        }
        var fileName = dd_outputFileName + "." + dd_baseCanvas['format'];
        var imgWidth = dd_baseCanvas['width'];
        var imgHeight = dd_baseCanvas['height'];
        var data = objCanvas.toDataURL('image/' + dd_baseCanvas['format']);
        var dataPrint = data;
        data = data.replace('data:image/' + dd_baseCanvas['format'] + ';base64,', '');
        var params = "action=sig&file_name=" + escape(fileName) + "&width=" + imgWidth + "&height=" + imgHeight + "&data=" + data + "&nocache=" + (Math.random() * 999);
        var rq = dd_xmlObject(2500, dd_dataProcessURL, params, dd_httpFail, [t, elementWritable]);
        if (typeof (rq) != "object") {
            alert(rq);
            return false
        }
        rq.onreadystatechange = function () {
            if (rq.readyState == 4 && rq.status == 200) {
                try {
                    window.clearTimeout(dd_xmlTimer)
                } catch (er) {};
                var info = rq.responseText;
                if (info.indexOf('success|') != -1) {
                    var brkI = info.split('|');
                    if (elementWritable) {
                        t.innerHTML = "Saved!"
                    }
                    if (dd_print2Element != '') {
                        var e, isWriteObj;
                        if (typeof (dd_print2Element) == 'string') {
                            isWriteObj = document.getElementById(dd_print2Element)
                        } else if (typeof (dd_print2Element) == 'object') {
                            isWriteObj = dd_print2Element
                        }
                        if (isWriteObj) {
                            if (isWriteObj.tagName.toLowerCase() == 'img') {
                                isWriteObj.src = dataPrint
                            } else {
                                var elemSet = ['div', 'span', 'p', 'li', 'blockquote', 'td', 'dd', 'body', 'em', 'a', 'small', 's', 'cite', 'kbd'];
                                for (e = 0; e < elemSet.length; e++) {
                                    if (isWriteObj.tagName.toLowerCase() == elemSet[e]) {
                                        var imgElem = document.createElement('img');
                                        imgElem.setAttribute('id', 'dd_imgWriteViewer');
                                        imgElem.setAttribute('src', dataPrint);
                                        isWriteObj.appendChild(imgElem);
                                        break
                                    }
                                }
                            }
                        }
                    }
                    dd_doPostAction.dataSaved(brkI[1])
                } else {
                    dd_httpFail(t)
                }
            }
        }
    };
    
    function dd_httpFail(t, w) {
        if (w) {
            t.innerHTML = t.getAttribute('dd_defaultvalue')
        }
        alert(dd_alert['savefail'])
    };
    var touchEnabled = ('ontouchstart' in document.documentElement ? true : false);
    var context, tool, offX, offY;
    var initCanvas = function (canvas) {
        if (touchEnabled) {
            offY = 0;
            offX = 0;
            o = canvas;
            do {
                offX += o.offsetLeft;
                offY += o.offsetTop
            } while (o = o.offsetParent)
        } else {
            offY = canvas.offsetTop;
            offX = canvas.offsetLeft
        }
        context = canvas.getContext('2d');
        context.strokeStyle = dd_baseCanvas['color'];
        context.lineWidth = dd_baseCanvas['linewidth'];
        context.lineCap = "round";
        context.lineJoin = "round";
        context.shadowColor = dd_baseCanvas['shadowcolor'];
        if (dd_agentIE) {
            context.shadowBlur = dd_baseCanvas['shadowblur_ie']
        } else if (dd_agentWK) {
            context.shadowBlur = dd_baseCanvas['shadowblur_wk']
        } else {
            context.shadowBlur = dd_baseCanvas['shadowblur']
        }
        if (touchEnabled) {
            canvas.addEventListener('touchstart', mover, false);
            canvas.addEventListener('touchmove', mover, false);
            canvas.addEventListener('touchend', mover, false)
        } else {
            canvas.addEventListener('mousedown', mover, false);
            canvas.addEventListener('mousemove', mover, false);
            canvas.addEventListener('mouseup', mover, false);
            canvas.addEventListener('mouseout', mover, false)
        }
        tool = new doPencil();
        
        function doPencil() {
            var tool = this;
            this.started = false;
            eventInit = function (e) {
                context.beginPath();
                context.moveTo(e._x, e._y);
                if (!isNaN(e._x) && !isNaN(e._y)) {
                    dd_drawnLines.push({
                        'x': new Array()
                        , 'y': new Array()
                    });
                    dd_drawnLines[dd_drawnPoint]['x'].push(e._x);
                    dd_drawnLines[dd_drawnPoint]['y'].push(e._y);
                    dd_drawnPoint++
                }
                tool.started = true
            };
            eventDraw = function (e) {
                if (tool.started) {
                    dd_drawingStarted = true;
                    context.lineTo(e._x, e._y);
                    context.stroke();
                    if (!isNaN(e._x)) {
                        dd_drawnLines[dd_drawnPoint - 1]['x'].push(e._x)
                    }
                    if (!isNaN(e._y)) {
                        dd_drawnLines[dd_drawnPoint - 1]['y'].push(e._y)
                    }
                }
            };
            eventEnd = function (e) {
                if (tool.started) {
                    tool.mousemove(e);
                    tool.started = false
                }
            };
            this.mousedown = function (e) {
                eventInit(e)
            };
            this.touchstart = function (e) {
                eventInit(e)
            };
            this.mousemove = function (e) {
                eventDraw(e)
            };
            this.touchmove = function (e) {
                eventDraw(e)
            };
            this.mouseup = function (e) {
                eventEnd(e)
            };
            this.touchend = function (e) {
                eventEnd(e)
            };
            canvas.onselectstart = function () {
                return false
            }
        };
        
        function mover(e) {
            if (e.type == "mouseout") {
                var func = tool['mouseup'];
                func(e);
                return false
            }
            var scaleOffsetX = 1;
            var scaleOffsetY = 1;
            var scrollOffset = (dd_agentIE && !dd_agentIE_10 ? document.documentElement.scrollTop : 0);
            if (touchEnabled) {
                e._x = e.targetTouches[0].pageX - offX;
                e._y = e.targetTouches[0].pageY - offY;
                e.preventDefault()
            } else {
                if (e.layerX || e.layerX == 0) {
                    e._x = Math.round((e.layerX - offX) * scaleOffsetX);
                    e._y = Math.round((e.layerY - offY - scrollOffset) * scaleOffsetY)
                } else if (e.offsetX || e.offsetX == 0) {
                    e._x = e.offsetX;
                    e._y = e.offsetY
                }
            }
            var doFunction = tool[e.type];
            if (doFunction) {
                doFunction(e)
            }
        }
    };
    var drawing_pad = new initCanvas(objCanvas)
};

window.addEventListener(
    'load'
    , function () {
        dd_buildStructure();
    }, false
);
