/*
Lecture Slides Javascript functions
Author: Marty Stepp
*/



var COLLAPSE_MULTIPLE_SPACES = true; // treat many spaces as a single space for diffing expressions?
var NBSP_CHAR_CODE = 160; // character code for non-breaking space (grr Safari)
var LINE_SEPARATOR = "\n";
var LINE_SEPARATOR_OUTPUT = "\n";
var DEFAULT_SPACES_PER_TAB = 4;
var DEFAULT_TAB_STRING = "    ";
var TAB_STRING = DEFAULT_TAB_STRING;

if (typeof($) === "undefined") {
    $ = function(id) {
        return document.getElementById(id);
    };
}

if (!window.observe) {
    window.observe = function(name, fn) {
        // addOnLoad(fn);

        // run right away, for inserted js code
        fn();
    };
    document.observe = function(name, fn) {
        fn();
    }
}

// attaches a window onload handler
function addOnLoad(fn) {
    if (window.addEventListener) {
        window.addEventListener("load", fn, false);
    } else if (window.attachEvent) {
        window.attachEvent("onload", fn);
    }
}


addOnLoad(slidesWindowLoad);

// sets up some links to open in a new window.
function slidesWindowLoad() {
    var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        if (links[i].className &&
            (links[i].className.indexOf("newwindow") >= 0 ||
             links[i].className.indexOf("popup") >= 0)) {
            // links[i].value = links[i].href;
            // links[i].href = "#";
            // links[i].onclick = loadLinkNewWindow;
            links[i].target = "_blank";
        }
    }
}


addOnLoad(function() {
    $$(".expressionanswer").each(function(element) {
        element.observe("change", expressionChange);
        element.observe("keydown", expressionChangeLater);
    });

    // multiple choice problems
    $$(".mcquestion input").each(function(element) {
        element.observe("change", multipleChoiceChange);
    });

    $$(".mcquestion").each(function(element) {
        if (element.hasClassName("shuffle")) {
            // shuffle choices
            var lis = element.select("li");
            for (var i = 0; i < lis.length; i++) {
                lis[i].remove();
            }
            shuffle(lis);
            for (var i = 0; i < lis.length; i++) {
                element.appendChild(lis[i]);
            }
        }
    });

    var exerciseCount = 0;
    $$(".exercisenumber").each(function(element) {
        if (!element.hasClassName("noincrement")) {
            exerciseCount++;
        }
        element.update(exerciseCount);
    });
});

function expressionChange(event) {
    checkCorrect(this, event);
    return true;
}

var checkTimer = null;

function expressionChangeLater(event) {
    this.stale = true;
    var that = this;
    var func = function() {
        checkTimer = null;
        if (that.stale) {
            checkCorrect(that, event);
        }
    };

    if (checkTimer) {
        clearTimeout(checkTimer);
    }
    checkTimer = setTimeout(func, 200);
    return true;
}

//check whether the given element's answer is correct;
//apply a "correct" or "incorrect" style appropriately
function checkCorrect(element, event, skipSound) {
    var parent = element.up(".expressionarea");
    if (!parent) {
        parent = element.up("tr");
    }
    var correctAnswer = htmlDecode(trim(getTextContent(parent.select(".expressionsolution")[0])));
    var studentAnswer = trim(element.value);

    var ignorePattern = "";

    var ignoreElement = parent.select(".ignore");
    if (ignoreElement && ignoreElement.length > 0) {
        ignorePattern = htmlDecode(getTextContent(ignoreElement[0]));
    }

    // collapse groups of multiple spaces into a single space
    // (useful for inheritance mystery problems)
    if (COLLAPSE_MULTIPLE_SPACES) {
        correctAnswer = correctAnswer.replace(/[ ]+/gi, " ");
        studentAnswer = studentAnswer.replace(/[ ]+/gi, " ");
    }

    // strip trailing spaces on lines
    correctAnswer = correctAnswer.replace(/[ ]+\r?\n/gi, LINE_SEPARATOR_OUTPUT);
    studentAnswer = studentAnswer.replace(/[ ]+\r?\n/gi, LINE_SEPARATOR_OUTPUT);

    // replace "ignore" pattern with empty
    if (ignorePattern) {
        var ignoreRegExp = new RegExp(ignorePattern, "gi");
        correctAnswer = correctAnswer.replace(ignoreRegExp, "");
        studentAnswer = studentAnswer.replace(ignoreRegExp, "");
    }

    // some problems' XML specifies that they should ignore capitalization
    if (element.hasClassName("ignorecase")) {
        correctAnswer = correctAnswer.toLowerCase();
        studentAnswer = studentAnswer.toLowerCase();
    }

    // some questions ignore all whitespace (e.g. section 2 #4)
    var correctAnswerNoWhitespace = correctAnswer.replace(/\s+/gi, "");
    var studentAnswerNoWhitespace = studentAnswer.replace(/\s+/gi, "");

    var correctAnswerNoType = correctAnswerNoWhitespace.toLowerCase().replace(/\"/g, "").replace(/\.0|\.$/g, "");
    var studentAnswerNoType = studentAnswerNoWhitespace.toLowerCase().replace(/\"/g, "").replace(/\.0|\.$/g, "");

    /*
    if (!event.shiftKey) {
        alert("correctAnswer = " + getDumpText(correctAnswer, true));
        alert("studentAnswer = " + getDumpText(studentAnswer, true));
        alert("correctAnswer == studentAnswer? " + (correctAnswer == studentAnswer));
    }

    if (event && (event.type == "keydown" || event.type == "keypress")) {
        // these events occur before the keypress
        if (event.charCode) {
            studentAnswer += String.fromCharCode(event.charCode);
        }
    }
    */

    var correct = true;
    var almost  = studentAnswerNoType == correctAnswerNoType;
    var changed = false;

    var td = element.up(".expressionarea")
    if (!td) {
        td = element.up("td");
    }
    if (!td) {
        td = parent;
    }

    if (!studentAnswer) {
        // blank
        element.removeClassName("correct");
        element.removeClassName("incorrect");
        element.removeClassName("almost");
        td.removeClassName("correct");
        td.removeClassName("incorrect");
        td.removeClassName("almost");
        correct = false;
    } else if (studentAnswer == correctAnswer || (correctAnswerNoWhitespace &&
            studentAnswerNoWhitespace == correctAnswerNoWhitespace)) {
        // right answer
        if (!td.hasClassName("correct")) {
            changed = true;
        }
        element.addClassName("correct");
        element.removeClassName("incorrect");
        element.removeClassName("almost");
        td.addClassName("correct");
        td.removeClassName("incorrect");
        td.removeClassName("almost");
    } else if (almost) {
        // nearly correct answer (wrong type, etc.)
        if (!td.hasClassName("almost")) {
            changed = true;
        }
        element.addClassName("almost");
        element.removeClassName("correct");
        element.removeClassName("incorrect");
        td.addClassName("almost");
        td.removeClassName("correct");
        td.removeClassName("incorrect");
		correct = false;
    } else {
        // wrong answer
        if (!td.hasClassName("incorrect")) {
            changed = true;
        }
        element.addClassName("incorrect");
        element.removeClassName("correct");
        element.removeClassName("almost");
        td.addClassName("incorrect");
        td.removeClassName("correct");
        td.removeClassName("almost");
        correct = false;
    }

    element.stale = false;
    return correct;
}

function getTextContent(element) {
    if (element.textContent !== undefined) {
        return element.textContent;
    } else if (element.innerText !== undefined) {
        return element.innerText;
    } else {
        return null;
    }
}

function multipleChoiceChange(event) {
    this.up(".mcquestion").select("input").each(function(input) {
        if (input.checked) {
            mcCheck(input);
        } else {
            mcUncheck(input);
        }
    });
}

function mcCheck(input) {
    // var img = input.next(".mcresultimage");
    // img.style.visibility = "visible";
    // img.style.display = "inline";
    // img.show();

    var mcq = input.up(".mcquestion");
    if (typeof(mcq.guesses) === "undefined") {
        mcq.guesses = 1;
    } else {
        mcq.guesses++;
    }
    mcq.title = "You have made " + mcq.guesses + " guess" + (mcq.guesses > 1 ? "es" : "") + " so far.";

    var label = input.up("label");
    label.className = "";
    if (input.hasClassName("mccorrect")) {
        label.className = "correct";
    } else {
        label.className = "incorrect";
    }
}

function mcUncheck(input) {
    // var img = input.next(".mcresultimage");
    // if (img.visible()) {
        // img.style.visibility = "hidden";
    //     img.style.display = "none";
    //     img.hide();
    // }

    var label = input.up("label");
    if (label) {
        label.className = "";
    }
}



// prints out all properties of the given object
function dump(obj, verbose) {
    var dumpTarget = $("dumptarget");
    if (dumpTarget) {
        setTextContent(dumpTarget, getDumpText(obj, verbose));
        dumpTarget.style.display = "block";
        scrollTo(dumpTarget);
    } else {
        alert(getDumpText(obj, verbose));
    }
}

function setTextContent(element, value) {
    element.textContent = value;
    element.innerText = value;
}

// returns text of all properties of the given object
function getDumpText(obj, verbose) {
    var text = "";
    if (obj === undefined) {
        text = "undefined";
    } else if (obj === null) {
        text = "null";
    } else if (typeof(obj) == "string") {
        var result = "string(length=" + obj.length + "): \n\"" + obj + "\"";
        if (verbose) {
            // display details about each index and character
            for (var i = 0; i < Math.min(10000, obj.length); i++) {
                if (i % 5 == 0) {
                     result += "\n";
                }
                result += "  " + padL("" + i, 3) + ": " + padL(toPrintableChar(obj.charAt(i)), 2) + "    ";
            }
        }
        return result;
    } else if (typeof(obj) != "object") {
        return typeof(obj) + ": " + obj;
    } else {
        text = "object {";
        var props = [];
        for (var prop in obj) {
            props.push(prop);
        }
        props.sort();

        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            try {
                if (prop == prop.toUpperCase()) { continue; }  // skips constants; dom objs have lots of them
                text += "\n  " + prop + "=";
                if (prop.match(/innerHTML/)) {
                    text += "[inner HTML, omitted]";
                } else if (obj[prop] && ("" + obj[prop]).match(/function/)) {
                    text += "[function]";
                } else {
                    text += obj[prop];
                }
            } catch (e) {
                text += "error accessing property '" + prop + "': " + e + "\n";
            }
        }

        if (text[text.length - 1] != "{") {
            text += "\n";
        }
        text += "}";
    }
    return text;
}


function loadLinkNewWindow() {
    window.open(this.value);
}

function htmlEncode(text) {
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    // text = text.replace(/ /g, "&nbsp;");
    return text;
}

function evaluateHTML(inId, outId) {
    var html = document.getElementById(inId).value;
    document.getElementById(outId).innerHTML = html;
}

function showAnswer(inId, outId) {
    var html = document.getElementById(inId).innerHTML;
    document.getElementById(outId).innerHTML = "<textarea style='width:100%; word-wrap: break-word;' wrap='logical' rows='8' cols='40'>" + htmlEncode(html) + "</textarea>";
}

function showAnswerAndHide(inId, outId) {
    var inElement = document.getElementById(inId);
    var html = inElement.innerHTML;
    inElement.style.visibility = 'hidden';
    inElement.style.height = '0px';

    var outElement = document.getElementById(outId);
    outElement.innerHTML = "<textarea style='width:100%; word-wrap: break-word;' wrap='logical' rows='16' cols='40'>" + htmlEncode(html) + "</textarea>";
    outElement.style.visibility = 'inherit';
}

function showExpected(inId, outId) {
    var outElement = document.getElementById(outId);
    outElement.style.visibility = 'hidden';
    outElement.style.height = '0px';

    var inElement = document.getElementById(inId);
    var html = inElement.innerHTML;
    inElement.style.visibility = 'inherit';
    inElement.style.height = 'auto';
}

function evaluateHTMLandShow(inId, answerId, outId) {
    var html = document.getElementById(inId).value;

    var answerElement = document.getElementById(answerId);
    answerElement.style.visibility = 'hidden';
    answerElement.style.height = '0px';

    var outElement = document.getElementById(outId);
    outElement.innerHTML = html;
    outElement.style.visibility = 'inherit';
}

// Rearranges the contents of the given array into random order.
function shuffle(array) {
    for (var i = 0; i < array.length - 1; i++) {
        var j = Math.floor(Math.random() * (array.length - i)) + i;
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}



// ------------------------------------------------
// taken from web programming step by step JS files

// eval() wrapper that makes sure that 'this' is the global window object
// (important for injecting dynamically generated student code)
function evalCode(solutionText) {
    solutionText = solutionText.replace(
        /function[ \t\n]+([a-zA-Z0-9_$]+)[ \t\n]*/g,
        'window.$1 = function');
    solutionText = solutionText.replace(
        /var[ \t\n]+([a-zA-Z0-9_$]+)[ \t\n]*/g,
        'window.$1 ');
    eval(solutionText);
}


// unit of indentation used in code examples in the chapters
// (tabs in code are replaced by this)
// var INDENT = "  ";
var INDENT = "  ";

addOnLoad(chapterOnLoad);

function chapterOnLoad() {
    // var chapterOutlineArea = $("chapteroutline");
    // if (chapterOutlineArea) {
    //     chapterOutlineArea.appendChild(buildChapterOutline());
    // }
    //
    // insertExampleNumbers();
    // insertFigureNumbers();
    // insertTableNumbers();
    // insertKeyTerms();

    insertExampleOutput();

    // color alternating rows of tables
    var tables = document.getElementsByTagName("table");
    for (var i = 0; i < tables.length; i++) {
        if (!tables[i].className.match(/coloralternatingrows/) &&
                !tables[i].className.match(/standard/)) {
            continue;
        }

        var rows = tables[i].getElementsByTagName("tr");
        for (var j = 0; j < rows.length; j += 2) {
            // color every other row
            rows[j].className += " evenrow";
        }
    }
}

// Parses the given string of CSS style text and applies its styles to the given HTML DOM element.
function applyStylesFromText(text, element) {
    text = text.replace(/\n/gi, " ");
    var styles = text.split(/}/);

    for (var i = 0; i < styles.length; i++) {
        // grab selector and remove { }
        var lbrace = styles[i].indexOf("{");
        if (lbrace < 0) {
            continue;
        }

        var selectorsText = trim(styles[i].substring(0, lbrace));
        var rules = trim(styles[i].substring(lbrace));
        styles[i] = trim(styles[i] + "}");
        rules = trim(rules.replace(/{/gi, ""));

        // apply the style rule to all elements within the given element
        var elements = element.getElementsByTagName("*");
        var selectors = selectorsText.split(/[ ]*,[ ]*/gi);   // break apart the selector into pieces (tricky)

        // special case: styles that apply to the body of the page
        for (var j = 0; j < selectors.length; j++) {
            if (selectorIsBodyStyle(selectors[j])) {
                applyStyle(rules, element);
            }
        }

        for (var j = 0; j < selectors.length; j++) {
            var currentSelector = selectors[j];

            // look for context selectors (ugh)
            // direct context (e.g. ul > li;  a list item that is a DIRECT child of a ul)
            var directContext = currentSelector.split(/[ ]*>[ ]*/gi);
            if (directContext.length > 1) {
                // alert("direct context: " + styles[i]);
                applyStyleWithContext(rules, directContext, 0, elements, true);
                continue;
            }

            // non-direct context (e.g. ul li;  a list item ANYWHERE inside a ul's descendents tree)
            var context = currentSelector.split(/[ ]+/gi);
            if (context.length > 1) {
                // alert("context: " + styles[i]);
                applyStyleWithContext(rules, context, 0, elements, false);
                continue;
            }

            // normal style; just apply to all elements
            for (var k = 0; k < elements.length; k++) {
                var currentElement = elements[k];

                // see which styles apply to this element
                if (selectorMatches(currentSelector, currentElement)) {
                    applyStyle(rules, currentElement);
                }
            }
        }
    }
}

// Applies a context style; Looks for elements that match the outer style(s),
// then children that match the inner style.
function applyStyleWithContext(rules, selectorParts, startIndex, elements, direct) {
    for (var k = 0; k < elements.length; k++) {
        var currentElement = elements[k];

        // see which styles apply to this element
        if (selectorMatches(selectorParts[startIndex], currentElement)) {
            if (startIndex >= selectorParts.length - 1) {
                // all selectors match!  apply rule
                applyStyle(rules, currentElement);
            } else {
                // see whether rest apply
                var children = (direct) ? currentElement.childNodes : currentElement.getElementsByTagName("*");
                applyStyleWithContext(rules, selectorParts, startIndex + 1, children, direct);
            }
        }
    }
}

function applyStyle(rules, element) {
    // look for all properties in the style and apply them
    var props = rules.split(/;/);
    for (var i = 0; i < props.length; i++) {
        var nameValue = props[i].split(/:/);
        if (!nameValue || nameValue.length < 2) {
            continue;
        }

        var name = trim(nameValue[0]);
        var value = trim(nameValue[1]);

        // some property names like font-family have to be changed to proper JS names like fontFamily
        name = name.replace(/\-([a-z])/gi, function($1) { return $1.toUpperCase(); });
        name = name.replace(/-/gi, "");

        // some JS DOM property names are different than their CSS counterparts
        if (name == "float") {
            name = "cssFloat";
        }

        // disallow fixed position (make it absolute)
        if (name == "position" && value == "fixed") {
            value = "absolute";
        }

        // alert("set " + name + " to " + value);
        element.style[name] = value;
    }
}

// Returns true if the given CSS selector string matches the given element.
function selectorMatches(selector, element) {
    if (!element.tagName) {
        // some text or attribute node
        return false;
    }

    var selectorTag = "";
    var selectorId = "";
    var selectorClass = "";

    // look for a tag (anything else before . or #)
    selectorTag = selectorGetTag(selector);
    if (selectorTag && element.tagName && selectorTag != element.tagName.toLowerCase()) {
        // rule doesn't apply to this element
        // alert("style:\n" + style + "\n\ndoesn't apply to element:\n" + element + " " + element.tagName + "\n(wrong tag " + selectorTag + ")");
        return false;
    }

    // look for a class (.)
    if (!selectorClass) {
        selectorClass = selectorGetClass(selector);
    }
    if (selectorClass && !hasClass(element, selectorClass)) {
        // rule doesn't apply to this element
        // alert("style:\n" + style + "\n\ndoesn't apply to element:\n" + element + "\n(missing class " + selectorClass + ")");
        return false;
    }

    // look for an id (#)
    selectorId = selectorGetId(selector);
    if (selectorId && selectorId != element.id) {
        // rule doesn't apply to this element
        // alert("style:\n" + style + "\n\ndoesn't apply to element:\n" + element + "\n(missing id " + selectorId + ")");
        return false;
    }

    // look for context (> or + or space)

    // if we get here, the rule must apply, so apply it!
    // alert("style:\n" + style + "\n\napplies to element:\n" + element + " " + element.tagName);
    return true;
}

function selectorGetClass(selector) {
    if (selector.indexOf(".") >= 0) {
        var classTokens = selector.split(/\./);
        return classTokens[classTokens.length - 1];
    } else {
        return null;
    }
}

function selectorIsBodyStyle(selector) {
    var selectorTag = selectorGetTag(selector);
    return selectorTag == "body" || selectorTag == "html";
}

function selectorGetId(selector) {
    if (selector.indexOf("#") >= 0) {
        var idTokens = selector.split(/#/);
        return idTokens[idTokens.length - 1];
    } else {
        return null;
    }
}

function selectorGetTag(selector) {
    var selectorId = selectorGetId(selector);
    if (selectorId) {
        var idTokens = selector.split(/#/);
        if (idTokens.length > 1) {
            return idTokens[0];
        } else {
            return null;
        }
    }

    var selectorClass = selectorGetClass(selector);
    if (selectorClass) {
        var classTokens = selector.split(/\./);
        if (classTokens.length > 1) {
            return classTokens[0];
        } else {
            return null;
        }
    }

    return selector;
}

// looks for all examples and inserts their "output" into the appropriate div
function insertExampleOutput() {
    var pre = document.getElementsByTagName("pre");
    for (var i = 0; i < pre.length; i++) {
        fixIndentation(pre[i]);
    }

    var exampleCodes = getElementsByClassName("pre", "examplecode");
    for (var i = 0; i < exampleCodes.length; i++) {
        var exampleCode = exampleCodes[i].innerHTML;
        // fixIndentation(exampleCodes[i]);

        // replace tabs with spaces and re-insert back into examplecode element
        var indentedExampleCode = exampleCode.replace(/\t/gi, INDENT);
        if (browserIsIE()) {
            exampleCodes[i].innerText = fixPreLineBreaks(indentedExampleCode);
            // exampleCodes[i].outerHTML = fixPreLineBreaks(indentedExampleCode);
        } else {
            exampleCodes[i].innerHTML = indentedExampleCode;
        }

        // now let's possibly inject this example code into an output div below it...

        // remove emphasized code and errors from the output
        exampleCode = exampleCode.replace(/<span class=\"[^\"]*\">([^<]*)<\/span>/gi, "$1");
        exampleCode = exampleCode.replace(/<em([^>]*)>([^<]*)<\/em>/gi, "$2");
        exampleCode = exampleCode.replace(/<var([^>]*)>([^<]*)<\/var>/gi, "$2");

        // HTML decode
        exampleCode = htmlDecode(exampleCode);

        var exampleOutput = getSiblingByClassName("insertoutput", exampleCodes[i], "*");
        if (exampleOutput) {
            // if this is HTML example code, insert its output into an 'insertoutput' div if necessary
            if (hasClass(exampleCodes[i], "html") || hasClass(exampleCodes[i], "xhtml")) {
                exampleOutput.innerHTML = exampleCode + exampleOutput.innerHTML;
            } else if (hasClass(exampleCodes[i], "css")) {
                applyStylesFromText(exampleCode, exampleOutput);
            } else if (hasClass(exampleCodes[i], "js")) {
                evalCode(exampleCode);
            }
        }
    }
}

function fixIndentation(element) {
    if (!element) return;
    var html = element.innerHTML || element.textContent || element.innerText;

    // replace tabs with spaces and re-insert back into examplecode element
    if (html) {
        html = html.replace(/\t/gi, "    ");
    }
    var indented = html;

    if (browserIsIE()) {
        element.innerHTML = fixPreLineBreaks(indented);
        // element.outerHTML = fixPreLineBreaks(indented);
    } else {
        element.innerHTML = indented;
    }
}

// Returns true if the current web browser is MS IE 6 (aka, fucking piece of shit).
function browserIsIE6() {
    return browserIsIE() && navigator.appVersion.match(/MSIE 6.0/);
}

// Returns true if the current web browser is MS IE (aka, fucking piece of shit).
function browserIsIE() {
    return !!navigator.appName.match(/Microsoft Internet Explorer/);
}

// TODO: *** fix awful argument order to match getChildrenByClassName
function getElementByClassName(tagName, className, root) {
    return getElementsByClassName(tagName, className, root)[0];
}

function getElementsByClassName(tagName, className, root) {
    var elements;
    if (root) {
        elements = root.getElementsByTagName(tagName);
    } else {
        elements = document.getElementsByTagName(tagName);
    }
    var result = [];
    for (var i = 0; i < elements.length; i++) {
        if (hasClass(elements[i], className)) {
            result.push(elements[i]);
        }
    }
    return result;
}

function getSiblingByClassName(className, element, tagName) {
    var kids = element.parentNode.childNodes;
    for (var i = 0; i < kids.length; i++) {
        if (hasClass(kids[i], className) && isTagName(kids[i], tagName)) {
            return kids[i];
        }
    }
    return null;
}

// not very good
function htmlDecode(text) {
    text = text.replace(/&lt;/g, "<");
    text = text.replace(/&gt;/g, ">");
    text = text.replace(/&nbsp;/g, " ");
    text = text.replace(/&quot;/g, " ");
    text = text.replace(/&amp;/g, "&");
    return text;
}

function isTagName(element, tagName) {
    var nodeName = element.nodeName.toLowerCase();
    if (tagName) { tagName = tagName.toLowerCase(); }
    return !tagName || tagName == "*" || nodeName == tagName;
}

// deletes whitespace from front and end of string
function trim(str) {
    return ltrim(rtrim(str));
}

// deletes whitespace from front of string
function ltrim(str) {
    if (!str) { return str; }
    for (var k = 0; k < str.length && str.charAt(k) <= " "; k++) {}
    return str.substring(k, str.length);
}

// deletes whitespace from end of string
function rtrim(str) {
    if (!str) { return str; }
    for (var j = str.length - 1; j >= 0 && str.charAt(j) <= " "; j--) {}
    return str.substring(0, j + 1);
}

function padL(text, length) {
    if (text && text.length !== undefined) {
        while (text.length < length) {
            text = " " + text;
        }
    }
    return text;
}

var foofoo = false;


// fixes pre block line break problems when injecting innerHTML on IE6
// (Internet Explorer fucking sucks!)
// *** TODO: check whether this is needed on IE7  (yes, it is)
function fixPreLineBreaks(text) {
    if (browserIsIE()) {
        if (!foofoo) {
            alert("Using IE!");
            foofoo = true;
        }
        text = text.replace(/\n/g, "<br/>\n");
        text = text.replace(/\t/g, "    ");
        text = text.replace(/ /g, "&nbsp;");
        text = text.replace(/\r/g, "");
        text = "<pre>" + text + "</pre>";
    }
    return text;
}
