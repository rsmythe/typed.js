// The MIT License (MIT)
// Typed.js | Copyright (c) 2016 Matt Boldt | www.mattboldt.com
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
"use strict";
var _this = this;
var TypedOptions = (function () {
    function TypedOptions(options) {
        var _this = this;
        this.strings = ["These are the default values...", "You know what you should do?", "Use your own!", "Have a great day!"];
        this.typeSpeed = 0;
        this.startDelay = 0;
        this.backSpeed = 0;
        this.shuffle = false;
        this.backDelay = 500;
        this.fadeOut = false;
        this.fadeOutClass = 'typed-fade-out';
        this.fadeOutDelay = 500;
        this.loop = false;
        this.loopCount = null;
        this.showCursor = true;
        this.cursorChar = "|";
        this.attr = null;
        this.contentType = 'html';
        this.callback = function () { };
        this.preStringTyped = function () { };
        this.onStringTyped = function () { };
        this.resetCallback = function () { };
        if (options) {
            Object.keys(options).forEach(function (key) {
                _this[key] = options[key];
            });
        }
    }
    return TypedOptions;
}());
var Typed = (function () {
    function Typed(selector, options) {
        this._isInput = null;
        this._strPos = 0;
        this._arrayPos = 0;
        this._stopNum = 0;
        this._curLoop = 0;
        this._sequence = [];
        this._timeout = null;
        this._cursor = null;
        this._stop = false;
        this._stringsElement = null;
        this._element = null;
        this._options = null;
        if (options instanceof TypedOptions) {
            this._options = options;
        }
        else {
            this._options = new TypedOptions(options);
        }
        var selection = document.querySelector(selector);
        if (selection instanceof HTMLElement) {
            this._element = selection;
        }
        else {
            throw 'typed.ts: invalid element selection';
        }
        // attribute to type into
        this._isInput = this._element.tagName.toLowerCase() === 'input';
        // div containing strings
        if ($ && this._options.stringsElement instanceof $) {
            this._stringsElement = this._options.stringsElement[0];
        }
        else if (this._options.stringsElement instanceof HTMLElement) {
            this._stringsElement = this._options.stringsElement;
        }
        // character number position of current string
        this._strPos = 0;
        // current array position
        this._arrayPos = 0;
        // number to stop backspacing on.
        // default 0, can change depending on how many chars
        // you want to remove at the time
        this._stopNum = 0;
        this._curLoop = 0;
        // for stopping
        this._stop = false;
        // the order of strings
        this._sequence = [];
        // All systems go!
        this.build();
    }
    Typed.prototype.init = function () {
        var _this = this;
        // begin the loop w/ first current string (global this.strings)
        // current string will be passed as an argument each time after this
        this._timeout = setTimeout(function () {
            for (var i = 0; i < _this._options.strings.length; ++i) {
                _this._sequence[i] = i;
            }
            // shuffle the array if true
            if (_this._options.shuffle) {
                _this._sequence = _this.shuffleArray(_this._sequence);
            }
            // Start typing
            _this.typewrite(_this._options.strings[_this._sequence[_this._arrayPos]], _this._strPos);
        }, this._options.startDelay);
    };
    Typed.prototype.build = function () {
        var _this = this;
        // Insert cursor
        if (this._options.showCursor === true) {
            this._cursor = document.createElement('span');
            this._cursor.className = 'typed-cursor';
            this._cursor.innerHTML = this._options.cursorChar;
            this._element.parentNode && this._element.parentNode.insertBefore(this._cursor, this._element.nextSibling);
        }
        if (this._stringsElement) {
            this._options.strings = [];
            this._stringsElement.style.display = 'none';
            var strings = Array.prototype.slice.apply(this._stringsElement.children);
            strings.forEach(function (stringElement) {
                _this._options.strings.push(stringElement.innerHTML);
            });
        }
        this.init();
    };
    // pass current string state to each function, types 1 char per call
    Typed.prototype.typewrite = function (curString, curStrPos) {
        var _this = this;
        // exit when stopped
        if (this._stop === true) {
            return;
        }
        if (this._options.fadeOut && this._element.classList.contains(this._options.fadeOutClass)) {
            this._element.classList.remove(this._options.fadeOutClass);
            this._cursor.classList.remove(this._options.fadeOutClass);
        }
        // varying values for setTimeout during typing
        // can't be global since number changes each time loop is executed
        var humanize = Math.round(Math.random() * (100 - 30)) + this._options.typeSpeed;
        // ------------- optional ------------- //
        // backpaces a certain string faster
        // ------------------------------------ //
        // if (this.arrayPos == 1){
        //  this.backDelay = 50;
        // }
        // else{ this.backDelay = 500; }
        // contain typing function in a timeout humanize'd delay
        this._timeout = setTimeout(function () {
            // check for an escape character before a pause value
            // format: \^\d+ .. eg: ^1000 .. should be able to print the ^ too using ^^
            // single ^ are removed from string
            var charPause = 0;
            var substr = curString.substr(curStrPos);
            if (substr.charAt(0) === '^') {
                var skip = 1; // skip atleast 1
                if (/^\^\d+/.test(substr)) {
                    substr = /\d+/.exec(substr)[0];
                    skip += substr.length;
                    charPause = parseInt(substr);
                }
                // strip out the escape character and pause value so they're not printed
                curString = curString.substring(0, curStrPos) + curString.substring(curStrPos + skip);
            }
            if (_this._options.contentType === 'html') {
                // skip over html tags while typing
                var curChar = curString.substr(curStrPos).charAt(0);
                if (curChar === '<' || curChar === '&') {
                    var tag = '';
                    var endTag = '';
                    if (curChar === '<') {
                        endTag = '>';
                    }
                    else {
                        endTag = ';';
                    }
                    while (curString.substr(curStrPos + 1).charAt(0) !== endTag) {
                        tag += curString.substr(curStrPos).charAt(0);
                        curStrPos++;
                        if (curStrPos + 1 > curString.length) {
                            break;
                        }
                    }
                    curStrPos++;
                    tag += endTag;
                }
            }
            // timeout for any pause after a character
            _this._timeout = setTimeout(function () {
                if (curStrPos === curString.length) {
                    // fires callback function
                    _this._options.onStringTyped(_this._arrayPos);
                    // is this the final string
                    if (_this._arrayPos === _this._options.strings.length - 1) {
                        // animation that occurs on the last typed string
                        _this._options.callback();
                        _this._curLoop++;
                        // quit if we wont loop back
                        if (_this._options.loop === false || _this._curLoop === _this._options.loopCount)
                            return;
                    }
                    _this._timeout = setTimeout(function () {
                        _this.backspace(curString, curStrPos);
                    }, _this._options.backDelay);
                }
                else {
                    /* call before functions if applicable */
                    if (curStrPos === 0) {
                        _this._options.preStringTyped(_this._arrayPos);
                    }
                    // start typing each new char into existing string
                    // curString: arg, this.el.html: original text inside element
                    var nextString = curString.substr(0, curStrPos + 1);
                    if (_this._options.attr) {
                        _this._element.setAttribute(_this._options.attr, nextString);
                    }
                    else {
                        if (_this._element instanceof HTMLInputElement) {
                            _this._element.value = nextString;
                        }
                        else if (_this._options.contentType === 'html') {
                            _this._element.innerHTML = nextString;
                        }
                        else {
                            _this._element.textContent = nextString;
                        }
                    }
                    // add characters one by one
                    curStrPos++;
                    // loop the function
                    _this.typewrite(curString, curStrPos);
                }
                // end of character pause
            }, charPause);
            // humanized value for typing
        }, humanize);
    };
    Typed.prototype.backspace = function (curString, curStrPos) {
        var _this = this;
        // exit when stopped
        if (this._stop === true) {
            return;
        }
        if (this._options.fadeOut) {
            this.initFadeOut();
            return;
        }
        // varying values for setTimeout during typing
        // can't be global since number changes each time loop is executed
        var humanize = Math.round(Math.random() * (100 - 30)) + this._options.backSpeed;
        this._timeout = setTimeout(function () {
            // ----- this part is optional ----- //
            // check string array position
            // on the first string, only delete one word
            // the stopNum actually represents the amount of chars to
            // keep in the current string. In my case it's 14.
            // if (this.arrayPos == 1){
            //  this.stopNum = 14;
            // }
            //every other time, delete the whole typed string
            // else{
            //  this.stopNum = 0;
            // }
            if (_this._options.contentType === 'html') {
                // skip over html tags while backspacing
                if (curString.substr(curStrPos).charAt(0) === '>') {
                    while (curString.substr(curStrPos - 1).charAt(0) !== '<') {
                        curStrPos--;
                        if (curStrPos < 0) {
                            break;
                        }
                    }
                    curStrPos--;
                }
            }
            // ----- continue important stuff ----- //
            // replace text with base text + typed characters
            var nextString = curString.substr(0, curStrPos);
            _this.replaceText(nextString);
            // if the number (id of character in current string) is
            // less than the stop number, keep going
            if (curStrPos > _this._stopNum) {
                // subtract characters one by one
                curStrPos--;
                // loop the function
                _this.backspace(curString, curStrPos);
            }
            else if (curStrPos <= _this._stopNum) {
                _this._arrayPos++;
                if (_this._arrayPos === _this._options.strings.length) {
                    _this._arrayPos = 0;
                    // Shuffle sequence again
                    if (_this._options.shuffle)
                        _this._sequence = _this.shuffleArray(_this._sequence);
                    _this.init();
                }
                else
                    _this.typewrite(_this._options.strings[_this._sequence[_this._arrayPos]], curStrPos);
            }
            // humanized value for typing
        }, humanize);
    };
    // Adds a CSS class to fade out current string
    Typed.prototype.initFadeOut = function () {
        var _this = this;
        this._element.className += ' ' + this._options.fadeOutClass;
        this._cursor.className += ' ' + this._options.fadeOutClass;
        return setTimeout(function () {
            _this._arrayPos++;
            _this.replaceText('');
            _this.typewrite(_this._options.strings[_this._sequence[_this._arrayPos]], 0);
        }, this._options.fadeOutDelay);
    };
    // Replaces current text in the HTML element
    Typed.prototype.replaceText = function (str) {
        if (this._options.attr) {
            this._element.setAttribute(this._options.attr, str);
        }
        else {
            if (this._element instanceof HTMLInputElement) {
                this._element.value = str;
            }
            else if (this._options.contentType === 'html') {
                this._element.innerHTML = str;
            }
            else {
                this._element.textContent = str;
            }
        }
    };
    // Shuffles the numbers in the given array.
    Typed.prototype.shuffleArray = function (array) {
        var tmp, current, top = array.length;
        if (top) {
            while (--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = array[current];
                array[current] = array[top];
                array[top] = tmp;
            }
        }
        return array;
    };
    // Start & Stop currently not working
    // public stop(): void {
    //     let this = this;
    //     this.stop = true;
    //     clearInterval(this.timeout);
    // }
    // public start(): void {
    //     let this = this;
    //     if(this.stop === false)
    //        return;
    //     this.stop = false;
    //     this.init();
    // }
    // Reset and rebuild the element
    Typed.prototype.reset = function () {
        clearInterval(this._timeout);
        var id = this._element.getAttribute('id');
        this._element.textContent = '';
        if (typeof this._cursor !== 'undefined' && typeof this._cursor.parentNode !== 'undefined') {
            this._cursor.parentNode.removeChild(this._cursor);
        }
        this._strPos = 0;
        this._arrayPos = 0;
        this._curLoop = 0;
        // Send the callback
        this._options.resetCallback();
    };
    return Typed;
}());
if ($) {
    $.fn.typed = function (option) {
        return _this.each(function () {
            var $this = $(_this), data = $this.data('typed'), options = typeof option == 'object' && option;
            if (data) {
                data.reset();
            }
            $this.data('typed', (data = new Typed(_this, options)));
        });
    };
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LENBQUM7WUFDakIsQ0FBQztZQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLEtBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUM7QUFDTixDQUFDIiwiZmlsZSI6ImpzL3R5cGVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcblxyXG4vLyBUeXBlZC5qcyB8IENvcHlyaWdodCAoYykgMjAxNiBNYXR0IEJvbGR0IHwgd3d3Lm1hdHRib2xkdC5jb21cclxuXHJcbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcblxyXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxyXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuXHJcbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcclxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXHJcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxyXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXHJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXHJcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cclxuLy8gVEhFIFNPRlRXQVJFLlxyXG5cclxuXHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbmludGVyZmFjZSBUeXBlZEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudFxyXG57XHJcbiAgICBfdHlwZWQ6IFR5cGVkO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSVR5cGVkT3B0aW9uc3tcclxuICAgIHN0cmluZ3M6IHN0cmluZ1tdO1xyXG4gICAgc3RyaW5nc0VsZW1lbnQ/OiBIVE1MRWxlbWVudDtcclxuICAgIHN0cmluZ3NFbGVtZW50U2VsZWN0b3I/OiBKUXVlcnk7XHJcblxyXG4gICAgLy8gdHlwaW5nIHNwZWVkXHJcbiAgICB0eXBlU3BlZWQ/OiBudW1iZXI7XHJcblxyXG4gICAgLy8gdGltZSBiZWZvcmUgdHlwaW5nIHN0YXJ0c1xyXG4gICAgc3RhcnREZWxheT86IG51bWJlcjtcclxuXHJcbiAgICAvLyBiYWNrc3BhY2luZyBzcGVlZFxyXG4gICAgYmFja1NwZWVkPzogbnVtYmVyO1xyXG5cclxuICAgIC8vIHNodWZmbGUgdGhlIHN0cmluZ3NcclxuICAgIHNodWZmbGU/OiBib29sZWFuO1xyXG5cclxuICAgIC8vIHRpbWUgYmVmb3JlIGJhY2tzcGFjaW5nXHJcbiAgICBiYWNrRGVsYXk/OiBudW1iZXI7XHJcblxyXG4gICAgLy8gRmFkZSBvdXQgaW5zdGVhZCBvZiBiYWNrc3BhY2VcclxuICAgIGZhZGVPdXQ/OiBib29sZWFuO1xyXG4gICAgZmFkZU91dENsYXNzPzogc3RyaW5nO1xyXG4gICAgZmFkZU91dERlbGF5PzogbnVtYmVyOyAvLyBtaWxsaXNlY29uZHNcclxuXHJcbiAgICAvLyBsb29wXHJcbiAgICBsb29wPzogYm9vbGVhbjtcclxuXHJcbiAgICAvLyBudWxsID0gaW5maW5pdGVcclxuICAgIGxvb3BDb3VudD86IG51bWJlcjtcclxuXHJcbiAgICAvLyBzaG93IGN1cnNvclxyXG4gICAgc2hvd0N1cnNvcj86IGJvb2xlYW47XHJcblxyXG4gICAgLy8gY2hhcmFjdGVyIGZvciBjdXJzb3JcclxuICAgIGN1cnNvckNoYXI/OiBzdHJpbmc7XHJcblxyXG4gICAgLy8gYXR0cmlidXRlIHRvIHR5cGUgKG51bGwgPT0gdGV4dClcclxuICAgIGF0dHI/OiBzdHJpbmc7XHJcblxyXG4gICAgLy8gZWl0aGVyIGh0bWwgb3IgdGV4dFxyXG4gICAgY29udGVudFR5cGU/OiAnaHRtbCcgfCAndGV4dCc7XHJcblxyXG4gICAgLy8gY2FsbCB3aGVuIGRvbmUgY2FsbGJhY2sgZnVuY3Rpb25cclxuICAgIGNhbGxiYWNrPzogKCkgPT4gdm9pZDtcclxuXHJcbiAgICAvLyBzdGFydGluZyBjYWxsYmFjayBmdW5jdGlvbiBiZWZvcmUgZWFjaCBzdHJpbmdcclxuICAgIHByZVN0cmluZ1R5cGVkPzogKGFycmF5UG9zPzogbnVtYmVyKSA9PiB2b2lkIDtcclxuXHJcbiAgICAvL2NhbGxiYWNrIGZvciBldmVyeSB0eXBlZCBzdHJpbmdcclxuICAgIG9uU3RyaW5nVHlwZWQ/OiAoYXJyYXlQb3M/OiBudW1iZXIpID0+IHZvaWQ7XHJcblxyXG4gICAgLy8gY2FsbGJhY2sgZm9yIHJlc2V0XHJcbiAgICByZXNldENhbGxiYWNrPzogKCkgPT4gdm9pZDtcclxufVxyXG5cclxuY2xhc3MgVHlwZWRPcHRpb25zIGltcGxlbWVudHMgSVR5cGVkT3B0aW9ucyB7XHJcbiAgICBwdWJsaWMgc3RyaW5nczogc3RyaW5nW10gPSBbXCJUaGVzZSBhcmUgdGhlIGRlZmF1bHQgdmFsdWVzLi4uXCIsIFwiWW91IGtub3cgd2hhdCB5b3Ugc2hvdWxkIGRvP1wiLCBcIlVzZSB5b3VyIG93biFcIiwgXCJIYXZlIGEgZ3JlYXQgZGF5IVwiXTtcclxuICAgIHB1YmxpYyBzdHJpbmdzRWxlbWVudDogSFRNTEVsZW1lbnQ7XHJcbiAgICBwdWJsaWMgc3RyaW5nc0VsZW1lbnRTZWxlY3RvcjogSlF1ZXJ5O1xyXG5cclxuICAgIHB1YmxpYyB0eXBlU3BlZWQ6IG51bWJlciA9IDA7XHJcblxyXG4gICAgcHVibGljIHN0YXJ0RGVsYXk6IG51bWJlciA9IDA7XHJcblxyXG4gICAgcHVibGljIGJhY2tTcGVlZDogbnVtYmVyID0gMDtcclxuXHJcbiAgICBwdWJsaWMgc2h1ZmZsZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBiYWNrRGVsYXk6IG51bWJlciA9IDUwMDtcclxuXHJcbiAgICBwdWJsaWMgZmFkZU91dDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIGZhZGVPdXRDbGFzczogc3RyaW5nID0gJ3R5cGVkLWZhZGUtb3V0JztcclxuICAgIHB1YmxpYyBmYWRlT3V0RGVsYXk6IG51bWJlciA9IDUwMDtcclxuXHJcbiAgICBwdWJsaWMgbG9vcDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyBsb29wQ291bnQ6IG51bWJlciA9IG51bGw7XHJcblxyXG4gICAgcHVibGljIHNob3dDdXJzb3I6IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgIHB1YmxpYyBjdXJzb3JDaGFyOiBzdHJpbmcgPSBcInxcIjtcclxuXHJcbiAgICBwdWJsaWMgYXR0cjogc3RyaW5nID0gbnVsbDtcclxuXHJcbiAgICBwdWJsaWMgY29udGVudFR5cGU6ICdodG1sJyB8ICd0ZXh0JyA9ICdodG1sJztcclxuXHJcbiAgICBwdWJsaWMgY2FsbGJhY2s6ICgpID0+IHZvaWQgPSAoKSA9PiB7fTtcclxuXHJcbiAgICBwdWJsaWMgcHJlU3RyaW5nVHlwZWQ6IChhcnJheVBvcz86IG51bWJlcikgPT4gdm9pZCA9ICgpID0+IHt9O1xyXG5cclxuICAgIHB1YmxpYyBvblN0cmluZ1R5cGVkOiAoYXJyYXlQb3M/OiBudW1iZXIpID0+IHZvaWQgPSAoKSA9PiB7fTtcclxuXHJcbiAgICBwdWJsaWMgcmVzZXRDYWxsYmFjazogKCkgPT4gdm9pZCA9ICgpID0+IHt9O1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihvcHRpb25zPzogSVR5cGVkT3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBpZihvcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBvcHRpb25zW2tleV07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcblxyXG5jbGFzcyBUeXBlZCB7XHJcbiAgICBwcml2YXRlIF9pc0lucHV0OiBib29sZWFuID0gbnVsbDtcclxuICAgIHByaXZhdGUgX3N0clBvczogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgX2FycmF5UG9zOiBudW1iZXIgPSAwO1xyXG4gICAgcHJpdmF0ZSBfc3RvcE51bTogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgX2N1ckxvb3A6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIF9zZXF1ZW5jZTogbnVtYmVyW10gPSBbXTtcclxuICAgIHByaXZhdGUgX3RpbWVvdXQ6IG51bWJlciA9IG51bGw7XHJcbiAgICBwcml2YXRlIF9jdXJzb3I6IEhUTUxFbGVtZW50ID0gbnVsbDtcclxuICAgIHByaXZhdGUgX3N0b3A6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgX3N0cmluZ3NFbGVtZW50OiBIVE1MRWxlbWVudCA9IG51bGw7XHJcbiAgICBwcml2YXRlIF9lbGVtZW50OiBIVE1MRWxlbWVudCA9IG51bGw7XHJcbiAgICBwcml2YXRlIF9vcHRpb25zOiBUeXBlZE9wdGlvbnMgPSBudWxsO1xyXG5cclxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihzZWxlY3Rvcjogc3RyaW5nLCBvcHRpb25zOiBJVHlwZWRPcHRpb25zIHwgVHlwZWRPcHRpb25zKSB7XHJcbiAgICAgICAgaWYob3B0aW9ucyBpbnN0YW5jZW9mIFR5cGVkT3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fb3B0aW9ucyA9IG5ldyBUeXBlZE9wdGlvbnMob3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgbGV0IHNlbGVjdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG4gICAgICAgIGlmKHNlbGVjdGlvbiBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KXtcclxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IHNlbGVjdGlvbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgdGhyb3cgJ3R5cGVkLnRzOiBpbnZhbGlkIGVsZW1lbnQgc2VsZWN0aW9uJztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gYXR0cmlidXRlIHRvIHR5cGUgaW50b1xyXG4gICAgICAgIHRoaXMuX2lzSW5wdXQgPSB0aGlzLl9lbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2lucHV0JztcclxuXHJcblxyXG4gICAgICAgIC8vIGRpdiBjb250YWluaW5nIHN0cmluZ3NcclxuICAgICAgICBpZiAoJCAmJiB0aGlzLl9vcHRpb25zLnN0cmluZ3NFbGVtZW50IGluc3RhbmNlb2YgJCkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdHJpbmdzRWxlbWVudCA9IHRoaXMuX29wdGlvbnMuc3RyaW5nc0VsZW1lbnRbMF1cclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX29wdGlvbnMuc3RyaW5nc0VsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdHJpbmdzRWxlbWVudCA9IHRoaXMuX29wdGlvbnMuc3RyaW5nc0VsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjaGFyYWN0ZXIgbnVtYmVyIHBvc2l0aW9uIG9mIGN1cnJlbnQgc3RyaW5nXHJcbiAgICAgICAgdGhpcy5fc3RyUG9zID0gMDtcclxuXHJcbiAgICAgICAgLy8gY3VycmVudCBhcnJheSBwb3NpdGlvblxyXG4gICAgICAgIHRoaXMuX2FycmF5UG9zID0gMDtcclxuXHJcbiAgICAgICAgLy8gbnVtYmVyIHRvIHN0b3AgYmFja3NwYWNpbmcgb24uXHJcbiAgICAgICAgLy8gZGVmYXVsdCAwLCBjYW4gY2hhbmdlIGRlcGVuZGluZyBvbiBob3cgbWFueSBjaGFyc1xyXG4gICAgICAgIC8vIHlvdSB3YW50IHRvIHJlbW92ZSBhdCB0aGUgdGltZVxyXG4gICAgICAgIHRoaXMuX3N0b3BOdW0gPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl9jdXJMb29wID0gMDtcclxuXHJcbiAgICAgICAgLy8gZm9yIHN0b3BwaW5nXHJcbiAgICAgICAgdGhpcy5fc3RvcCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyB0aGUgb3JkZXIgb2Ygc3RyaW5nc1xyXG4gICAgICAgIHRoaXMuX3NlcXVlbmNlID0gW107XHJcblxyXG4gICAgICAgIC8vIEFsbCBzeXN0ZW1zIGdvIVxyXG4gICAgICAgIHRoaXMuYnVpbGQoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBpbml0KCk6IHZvaWQge1xyXG4gICAgICAgIC8vIGJlZ2luIHRoZSBsb29wIHcvIGZpcnN0IGN1cnJlbnQgc3RyaW5nIChnbG9iYWwgdGhpcy5zdHJpbmdzKVxyXG4gICAgICAgIC8vIGN1cnJlbnQgc3RyaW5nIHdpbGwgYmUgcGFzc2VkIGFzIGFuIGFyZ3VtZW50IGVhY2ggdGltZSBhZnRlciB0aGlzXHJcbiAgICAgICAgdGhpcy5fdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX29wdGlvbnMuc3RyaW5ncy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VxdWVuY2VbaV0gPSBpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBzaHVmZmxlIHRoZSBhcnJheSBpZiB0cnVlXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9vcHRpb25zLnNodWZmbGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NlcXVlbmNlID0gdGhpcy5zaHVmZmxlQXJyYXkodGhpcy5fc2VxdWVuY2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTdGFydCB0eXBpbmdcclxuICAgICAgICAgICAgdGhpcy50eXBld3JpdGUodGhpcy5fb3B0aW9ucy5zdHJpbmdzW3RoaXMuX3NlcXVlbmNlW3RoaXMuX2FycmF5UG9zXV0sIHRoaXMuX3N0clBvcyk7XHJcbiAgICAgICAgfSwgdGhpcy5fb3B0aW9ucy5zdGFydERlbGF5KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYnVpbGQoKSB7XHJcbiAgICAgICAgLy8gSW5zZXJ0IGN1cnNvclxyXG4gICAgICAgIGlmICh0aGlzLl9vcHRpb25zLnNob3dDdXJzb3IgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fY3Vyc29yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgICAgICB0aGlzLl9jdXJzb3IuY2xhc3NOYW1lID0gJ3R5cGVkLWN1cnNvcic7XHJcbiAgICAgICAgICAgIHRoaXMuX2N1cnNvci5pbm5lckhUTUwgPSB0aGlzLl9vcHRpb25zLmN1cnNvckNoYXI7XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQucGFyZW50Tm9kZSAmJiB0aGlzLl9lbGVtZW50LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMuX2N1cnNvciwgdGhpcy5fZWxlbWVudC5uZXh0U2libGluZyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9zdHJpbmdzRWxlbWVudCkge1xyXG4gICAgICAgICAgICB0aGlzLl9vcHRpb25zLnN0cmluZ3MgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5fc3RyaW5nc0VsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgbGV0IHN0cmluZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkodGhpcy5fc3RyaW5nc0VsZW1lbnQuY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICBzdHJpbmdzLmZvckVhY2goKHN0cmluZ0VsZW1lbnQ6IEhUTUxFbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9vcHRpb25zLnN0cmluZ3MucHVzaChzdHJpbmdFbGVtZW50LmlubmVySFRNTCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gXHJcbiAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcGFzcyBjdXJyZW50IHN0cmluZyBzdGF0ZSB0byBlYWNoIGZ1bmN0aW9uLCB0eXBlcyAxIGNoYXIgcGVyIGNhbGxcclxuICAgIHByaXZhdGUgdHlwZXdyaXRlKGN1clN0cmluZzogc3RyaW5nLCBjdXJTdHJQb3M6IG51bWJlcikge1xyXG4gICAgICAgIC8vIGV4aXQgd2hlbiBzdG9wcGVkXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0b3AgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMuZmFkZU91dCAmJiB0aGlzLl9lbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyh0aGlzLl9vcHRpb25zLmZhZGVPdXRDbGFzcykpIHtcclxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuX29wdGlvbnMuZmFkZU91dENsYXNzKTtcclxuICAgICAgICAgICAgdGhpcy5fY3Vyc29yLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5fb3B0aW9ucy5mYWRlT3V0Q2xhc3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdmFyeWluZyB2YWx1ZXMgZm9yIHNldFRpbWVvdXQgZHVyaW5nIHR5cGluZ1xyXG4gICAgICAgIC8vIGNhbid0IGJlIGdsb2JhbCBzaW5jZSBudW1iZXIgY2hhbmdlcyBlYWNoIHRpbWUgbG9vcCBpcyBleGVjdXRlZFxyXG4gICAgICAgIGxldCBodW1hbml6ZTogbnVtYmVyID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogKDEwMCAtIDMwKSkgKyB0aGlzLl9vcHRpb25zLnR5cGVTcGVlZDtcclxuXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLSBvcHRpb25hbCAtLS0tLS0tLS0tLS0tIC8vXHJcbiAgICAgICAgLy8gYmFja3BhY2VzIGEgY2VydGFpbiBzdHJpbmcgZmFzdGVyXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXHJcbiAgICAgICAgLy8gaWYgKHRoaXMuYXJyYXlQb3MgPT0gMSl7XHJcbiAgICAgICAgLy8gIHRoaXMuYmFja0RlbGF5ID0gNTA7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIC8vIGVsc2V7IHRoaXMuYmFja0RlbGF5ID0gNTAwOyB9XHJcblxyXG4gICAgICAgIC8vIGNvbnRhaW4gdHlwaW5nIGZ1bmN0aW9uIGluIGEgdGltZW91dCBodW1hbml6ZSdkIGRlbGF5XHJcbiAgICAgICAgdGhpcy5fdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAvLyBjaGVjayBmb3IgYW4gZXNjYXBlIGNoYXJhY3RlciBiZWZvcmUgYSBwYXVzZSB2YWx1ZVxyXG4gICAgICAgICAgICAvLyBmb3JtYXQ6IFxcXlxcZCsgLi4gZWc6IF4xMDAwIC4uIHNob3VsZCBiZSBhYmxlIHRvIHByaW50IHRoZSBeIHRvbyB1c2luZyBeXlxyXG4gICAgICAgICAgICAvLyBzaW5nbGUgXiBhcmUgcmVtb3ZlZCBmcm9tIHN0cmluZ1xyXG4gICAgICAgICAgICBsZXQgY2hhclBhdXNlOiBudW1iZXIgPSAwO1xyXG4gICAgICAgICAgICBsZXQgc3Vic3RyOiBzdHJpbmcgPSBjdXJTdHJpbmcuc3Vic3RyKGN1clN0clBvcyk7XHJcbiAgICAgICAgICAgIGlmIChzdWJzdHIuY2hhckF0KDApID09PSAnXicpIHtcclxuICAgICAgICAgICAgICAgIGxldCBza2lwID0gMTsgLy8gc2tpcCBhdGxlYXN0IDFcclxuICAgICAgICAgICAgICAgIGlmICgvXlxcXlxcZCsvLnRlc3Qoc3Vic3RyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1YnN0ciA9IC9cXGQrLy5leGVjKHN1YnN0cilbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgc2tpcCArPSBzdWJzdHIubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJQYXVzZSA9IHBhcnNlSW50KHN1YnN0cik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gc3RyaXAgb3V0IHRoZSBlc2NhcGUgY2hhcmFjdGVyIGFuZCBwYXVzZSB2YWx1ZSBzbyB0aGV5J3JlIG5vdCBwcmludGVkXHJcbiAgICAgICAgICAgICAgICBjdXJTdHJpbmcgPSBjdXJTdHJpbmcuc3Vic3RyaW5nKDAsIGN1clN0clBvcykgKyBjdXJTdHJpbmcuc3Vic3RyaW5nKGN1clN0clBvcyArIHNraXApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fb3B0aW9ucy5jb250ZW50VHlwZSA9PT0gJ2h0bWwnKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBza2lwIG92ZXIgaHRtbCB0YWdzIHdoaWxlIHR5cGluZ1xyXG4gICAgICAgICAgICAgICAgbGV0IGN1ckNoYXI6IHN0cmluZyA9IGN1clN0cmluZy5zdWJzdHIoY3VyU3RyUG9zKS5jaGFyQXQoMCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VyQ2hhciA9PT0gJzwnIHx8IGN1ckNoYXIgPT09ICcmJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0YWc6IHN0cmluZyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBlbmRUYWc6IHN0cmluZyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJDaGFyID09PSAnPCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kVGFnID0gJz4nXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kVGFnID0gJzsnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChjdXJTdHJpbmcuc3Vic3RyKGN1clN0clBvcyArIDEpLmNoYXJBdCgwKSAhPT0gZW5kVGFnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZyArPSBjdXJTdHJpbmcuc3Vic3RyKGN1clN0clBvcykuY2hhckF0KDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJTdHJQb3MrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1clN0clBvcyArIDEgPiBjdXJTdHJpbmcubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjdXJTdHJQb3MrKztcclxuICAgICAgICAgICAgICAgICAgICB0YWcgKz0gZW5kVGFnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyB0aW1lb3V0IGZvciBhbnkgcGF1c2UgYWZ0ZXIgYSBjaGFyYWN0ZXJcclxuICAgICAgICAgICAgdGhpcy5fdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1clN0clBvcyA9PT0gY3VyU3RyaW5nLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZpcmVzIGNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb3B0aW9ucy5vblN0cmluZ1R5cGVkKHRoaXMuX2FycmF5UG9zKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaXMgdGhpcyB0aGUgZmluYWwgc3RyaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2FycmF5UG9zID09PSB0aGlzLl9vcHRpb25zLnN0cmluZ3MubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhbmltYXRpb24gdGhhdCBvY2N1cnMgb24gdGhlIGxhc3QgdHlwZWQgc3RyaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX29wdGlvbnMuY2FsbGJhY2soKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1ckxvb3ArKztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1aXQgaWYgd2Ugd29udCBsb29wIGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMubG9vcCA9PT0gZmFsc2UgfHwgdGhpcy5fY3VyTG9vcCA9PT0gdGhpcy5fb3B0aW9ucy5sb29wQ291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYmFja3NwYWNlKGN1clN0cmluZywgY3VyU3RyUG9zKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCB0aGlzLl9vcHRpb25zLmJhY2tEZWxheSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLyogY2FsbCBiZWZvcmUgZnVuY3Rpb25zIGlmIGFwcGxpY2FibGUgKi9cclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VyU3RyUG9zID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX29wdGlvbnMucHJlU3RyaW5nVHlwZWQodGhpcy5fYXJyYXlQb3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RhcnQgdHlwaW5nIGVhY2ggbmV3IGNoYXIgaW50byBleGlzdGluZyBzdHJpbmdcclxuICAgICAgICAgICAgICAgICAgICAvLyBjdXJTdHJpbmc6IGFyZywgdGhpcy5lbC5odG1sOiBvcmlnaW5hbCB0ZXh0IGluc2lkZSBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5leHRTdHJpbmcgPSBjdXJTdHJpbmcuc3Vic3RyKDAsIGN1clN0clBvcyArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9vcHRpb25zLmF0dHIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zZXRBdHRyaWJ1dGUodGhpcy5fb3B0aW9ucy5hdHRyLCBuZXh0U3RyaW5nKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQudmFsdWUgPSBuZXh0U3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX29wdGlvbnMuY29udGVudFR5cGUgPT09ICdodG1sJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5pbm5lckhUTUwgPSBuZXh0U3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZWxlbWVudC50ZXh0Q29udGVudCA9IG5leHRTdHJpbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZCBjaGFyYWN0ZXJzIG9uZSBieSBvbmVcclxuICAgICAgICAgICAgICAgICAgICBjdXJTdHJQb3MrKztcclxuICAgICAgICAgICAgICAgICAgICAvLyBsb29wIHRoZSBmdW5jdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHlwZXdyaXRlKGN1clN0cmluZywgY3VyU3RyUG9zKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIGVuZCBvZiBjaGFyYWN0ZXIgcGF1c2VcclxuICAgICAgICAgICAgfSwgY2hhclBhdXNlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGh1bWFuaXplZCB2YWx1ZSBmb3IgdHlwaW5nXHJcbiAgICAgICAgfSwgaHVtYW5pemUpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGJhY2tzcGFjZShjdXJTdHJpbmc6IHN0cmluZywgY3VyU3RyUG9zOiBudW1iZXIpIHtcclxuICAgICAgICAvLyBleGl0IHdoZW4gc3RvcHBlZFxyXG4gICAgICAgIGlmICh0aGlzLl9zdG9wID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9vcHRpb25zLmZhZGVPdXQpIHtcclxuICAgICAgICAgICAgdGhpcy5pbml0RmFkZU91dCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB2YXJ5aW5nIHZhbHVlcyBmb3Igc2V0VGltZW91dCBkdXJpbmcgdHlwaW5nXHJcbiAgICAgICAgLy8gY2FuJ3QgYmUgZ2xvYmFsIHNpbmNlIG51bWJlciBjaGFuZ2VzIGVhY2ggdGltZSBsb29wIGlzIGV4ZWN1dGVkXHJcbiAgICAgICAgbGV0IGh1bWFuaXplOiBudW1iZXIgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAoMTAwIC0gMzApKSArIHRoaXMuX29wdGlvbnMuYmFja1NwZWVkO1xyXG5cclxuICAgICAgICB0aGlzLl90aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAvLyAtLS0tLSB0aGlzIHBhcnQgaXMgb3B0aW9uYWwgLS0tLS0gLy9cclxuICAgICAgICAgICAgLy8gY2hlY2sgc3RyaW5nIGFycmF5IHBvc2l0aW9uXHJcbiAgICAgICAgICAgIC8vIG9uIHRoZSBmaXJzdCBzdHJpbmcsIG9ubHkgZGVsZXRlIG9uZSB3b3JkXHJcbiAgICAgICAgICAgIC8vIHRoZSBzdG9wTnVtIGFjdHVhbGx5IHJlcHJlc2VudHMgdGhlIGFtb3VudCBvZiBjaGFycyB0b1xyXG4gICAgICAgICAgICAvLyBrZWVwIGluIHRoZSBjdXJyZW50IHN0cmluZy4gSW4gbXkgY2FzZSBpdCdzIDE0LlxyXG4gICAgICAgICAgICAvLyBpZiAodGhpcy5hcnJheVBvcyA9PSAxKXtcclxuICAgICAgICAgICAgLy8gIHRoaXMuc3RvcE51bSA9IDE0O1xyXG4gICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIC8vZXZlcnkgb3RoZXIgdGltZSwgZGVsZXRlIHRoZSB3aG9sZSB0eXBlZCBzdHJpbmdcclxuICAgICAgICAgICAgLy8gZWxzZXtcclxuICAgICAgICAgICAgLy8gIHRoaXMuc3RvcE51bSA9IDA7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9vcHRpb25zLmNvbnRlbnRUeXBlID09PSAnaHRtbCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIHNraXAgb3ZlciBodG1sIHRhZ3Mgd2hpbGUgYmFja3NwYWNpbmdcclxuICAgICAgICAgICAgICAgIGlmIChjdXJTdHJpbmcuc3Vic3RyKGN1clN0clBvcykuY2hhckF0KDApID09PSAnPicpIHtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY3VyU3RyaW5nLnN1YnN0cihjdXJTdHJQb3MgLSAxKS5jaGFyQXQoMCkgIT09ICc8Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJTdHJQb3MtLTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1clN0clBvcyA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGN1clN0clBvcy0tO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAtLS0tLSBjb250aW51ZSBpbXBvcnRhbnQgc3R1ZmYgLS0tLS0gLy9cclxuICAgICAgICAgICAgLy8gcmVwbGFjZSB0ZXh0IHdpdGggYmFzZSB0ZXh0ICsgdHlwZWQgY2hhcmFjdGVyc1xyXG4gICAgICAgICAgICBsZXQgbmV4dFN0cmluZyA9IGN1clN0cmluZy5zdWJzdHIoMCwgY3VyU3RyUG9zKTtcclxuICAgICAgICAgICAgdGhpcy5yZXBsYWNlVGV4dChuZXh0U3RyaW5nKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmIHRoZSBudW1iZXIgKGlkIG9mIGNoYXJhY3RlciBpbiBjdXJyZW50IHN0cmluZykgaXNcclxuICAgICAgICAgICAgLy8gbGVzcyB0aGFuIHRoZSBzdG9wIG51bWJlciwga2VlcCBnb2luZ1xyXG4gICAgICAgICAgICBpZiAoY3VyU3RyUG9zID4gdGhpcy5fc3RvcE51bSkge1xyXG4gICAgICAgICAgICAgICAgLy8gc3VidHJhY3QgY2hhcmFjdGVycyBvbmUgYnkgb25lXHJcbiAgICAgICAgICAgICAgICBjdXJTdHJQb3MtLTtcclxuICAgICAgICAgICAgICAgIC8vIGxvb3AgdGhlIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJhY2tzcGFjZShjdXJTdHJpbmcsIGN1clN0clBvcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gaWYgdGhlIHN0b3AgbnVtYmVyIGhhcyBiZWVuIHJlYWNoZWQsIGluY3JlYXNlXHJcbiAgICAgICAgICAgIC8vIGFycmF5IHBvc2l0aW9uIHRvIG5leHQgc3RyaW5nXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGN1clN0clBvcyA8PSB0aGlzLl9zdG9wTnVtKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9hcnJheVBvcysrO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hcnJheVBvcyA9PT0gdGhpcy5fb3B0aW9ucy5zdHJpbmdzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FycmF5UG9zID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2h1ZmZsZSBzZXF1ZW5jZSBhZ2FpblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9vcHRpb25zLnNodWZmbGUpIHRoaXMuX3NlcXVlbmNlID0gdGhpcy5zaHVmZmxlQXJyYXkodGhpcy5fc2VxdWVuY2UpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluaXQoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHlwZXdyaXRlKHRoaXMuX29wdGlvbnMuc3RyaW5nc1t0aGlzLl9zZXF1ZW5jZVt0aGlzLl9hcnJheVBvc11dLCBjdXJTdHJQb3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBodW1hbml6ZWQgdmFsdWUgZm9yIHR5cGluZ1xyXG4gICAgICAgIH0sIGh1bWFuaXplKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkcyBhIENTUyBjbGFzcyB0byBmYWRlIG91dCBjdXJyZW50IHN0cmluZ1xyXG4gICAgcHJpdmF0ZSBpbml0RmFkZU91dCgpIHtcclxuICAgICAgICB0aGlzLl9lbGVtZW50LmNsYXNzTmFtZSArPSAnICcgKyB0aGlzLl9vcHRpb25zLmZhZGVPdXRDbGFzcztcclxuICAgICAgICB0aGlzLl9jdXJzb3IuY2xhc3NOYW1lICs9ICcgJyArIHRoaXMuX29wdGlvbnMuZmFkZU91dENsYXNzO1xyXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5fYXJyYXlQb3MrKztcclxuICAgICAgICAgICAgdGhpcy5yZXBsYWNlVGV4dCgnJylcclxuICAgICAgICAgICAgdGhpcy50eXBld3JpdGUodGhpcy5fb3B0aW9ucy5zdHJpbmdzW3RoaXMuX3NlcXVlbmNlW3RoaXMuX2FycmF5UG9zXV0sIDApO1xyXG4gICAgICAgIH0sIHRoaXMuX29wdGlvbnMuZmFkZU91dERlbGF5KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZXBsYWNlcyBjdXJyZW50IHRleHQgaW4gdGhlIEhUTUwgZWxlbWVudFxyXG4gICAgcHJpdmF0ZSByZXBsYWNlVGV4dChzdHIpIHtcclxuICAgICAgICBpZiAodGhpcy5fb3B0aW9ucy5hdHRyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQuc2V0QXR0cmlidXRlKHRoaXMuX29wdGlvbnMuYXR0ciwgc3RyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQudmFsdWUgPSBzdHI7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fb3B0aW9ucy5jb250ZW50VHlwZSA9PT0gJ2h0bWwnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9lbGVtZW50LmlubmVySFRNTCA9IHN0cjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQudGV4dENvbnRlbnQgPSBzdHI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2h1ZmZsZXMgdGhlIG51bWJlcnMgaW4gdGhlIGdpdmVuIGFycmF5LlxyXG4gICAgcHJpdmF0ZSBzaHVmZmxlQXJyYXkoYXJyYXkpIHtcclxuICAgICAgICBsZXQgdG1wLCBjdXJyZW50LCB0b3AgPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgaWYgKHRvcCkge1xyXG4gICAgICAgICAgICB3aGlsZSAoLS10b3ApIHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAodG9wICsgMSkpO1xyXG4gICAgICAgICAgICAgICAgdG1wID0gYXJyYXlbY3VycmVudF07XHJcbiAgICAgICAgICAgICAgICBhcnJheVtjdXJyZW50XSA9IGFycmF5W3RvcF07XHJcbiAgICAgICAgICAgICAgICBhcnJheVt0b3BdID0gdG1wO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnJheTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGFydCAmIFN0b3AgY3VycmVudGx5IG5vdCB3b3JraW5nXHJcblxyXG4gICAgLy8gcHVibGljIHN0b3AoKTogdm9pZCB7XHJcbiAgICAvLyAgICAgbGV0IHRoaXMgPSB0aGlzO1xyXG5cclxuICAgIC8vICAgICB0aGlzLnN0b3AgPSB0cnVlO1xyXG4gICAgLy8gICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lb3V0KTtcclxuICAgIC8vIH1cclxuXHJcbiAgICAvLyBwdWJsaWMgc3RhcnQoKTogdm9pZCB7XHJcbiAgICAvLyAgICAgbGV0IHRoaXMgPSB0aGlzO1xyXG4gICAgLy8gICAgIGlmKHRoaXMuc3RvcCA9PT0gZmFsc2UpXHJcbiAgICAvLyAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIC8vICAgICB0aGlzLnN0b3AgPSBmYWxzZTtcclxuICAgIC8vICAgICB0aGlzLmluaXQoKTtcclxuICAgIC8vIH1cclxuXHJcbiAgICAvLyBSZXNldCBhbmQgcmVidWlsZCB0aGUgZWxlbWVudFxyXG4gICAgcHJpdmF0ZSByZXNldCgpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKHRoaXMuX3RpbWVvdXQpO1xyXG4gICAgICAgIGxldCBpZCA9IHRoaXMuX2VsZW1lbnQuZ2V0QXR0cmlidXRlKCdpZCcpO1xyXG4gICAgICAgIHRoaXMuX2VsZW1lbnQudGV4dENvbnRlbnQgPSAnJztcclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2N1cnNvciAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHRoaXMuX2N1cnNvci5wYXJlbnROb2RlICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICB0aGlzLl9jdXJzb3IucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jdXJzb3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9zdHJQb3MgPSAwO1xyXG4gICAgICAgIHRoaXMuX2FycmF5UG9zID0gMDtcclxuICAgICAgICB0aGlzLl9jdXJMb29wID0gMDtcclxuICAgICAgICAvLyBTZW5kIHRoZSBjYWxsYmFja1xyXG4gICAgICAgIHRoaXMuX29wdGlvbnMucmVzZXRDYWxsYmFjaygpO1xyXG4gICAgfVxyXG59XHJcblxyXG5pZiAoJCkge1xyXG4gICAgJC5mbi50eXBlZCA9IChvcHRpb24pID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKCgpID0+IHtcclxuICAgICAgICAgICAgbGV0ICR0aGlzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCd0eXBlZCcpLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uO1xyXG4gICAgICAgICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgZGF0YS5yZXNldCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICR0aGlzLmRhdGEoJ3R5cGVkJywgKGRhdGEgPSBuZXcgVHlwZWQodGhpcywgb3B0aW9ucykpKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn0iXX0=
