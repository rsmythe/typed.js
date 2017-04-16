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

interface TypedElement extends HTMLElement
{
    _typed: Typed;
}

interface ITypedOptions{
    strings: string[];
    stringsElement?: HTMLElement;
    stringsElementSelector?: JQuery;

    // typing speed
    typeSpeed?: number;

    // time before typing starts
    startDelay?: number;

    // backspacing speed
    backSpeed?: number;

    // shuffle the strings
    shuffle?: boolean;

    // time before backspacing
    backDelay?: number;

    // Fade out instead of backspace
    fadeOut?: boolean;
    fadeOutClass?: string;
    fadeOutDelay?: number; // milliseconds

    // loop
    loop?: boolean;

    // null = infinite
    loopCount?: number;

    // show cursor
    showCursor?: boolean;

    // character for cursor
    cursorChar?: string;

    // attribute to type (null == text)
    attr?: string;

    // either html or text
    contentType?: 'html' | 'text';

    // call when done callback function
    callback?: () => void;

    // starting callback function before each string
    preStringTyped?: (arrayPos?: number) => void ;

    //callback for every typed string
    onStringTyped?: (arrayPos?: number) => void;

    // callback for reset
    resetCallback?: () => void;
}

class TypedOptions implements ITypedOptions {
    public strings: string[] = ["These are the default values...", "You know what you should do?", "Use your own!", "Have a great day!"];
    public stringsElement: HTMLElement;
    public stringsElementSelector: JQuery;

    public typeSpeed: number = 0;

    public startDelay: number = 0;

    public backSpeed: number = 0;

    public shuffle: boolean = false;

    public backDelay: number = 500;

    public fadeOut: boolean = false;
    public fadeOutClass: string = 'typed-fade-out';
    public fadeOutDelay: number = 500;

    public loop: boolean = false;

    public loopCount: number = null;

    public showCursor: boolean = true;

    public cursorChar: string = "|";

    public attr: string = null;

    public contentType: 'html' | 'text' = 'html';

    public callback: () => void = () => {};

    public preStringTyped: (arrayPos?: number) => void = () => {};

    public onStringTyped: (arrayPos?: number) => void = () => {};

    public resetCallback: () => void = () => {};

    public constructor(options?: ITypedOptions)
    {
        if(options)
        {
            Object.keys(options).forEach((key) => {
                this[key] = options[key];
            });
        }
    }
}



class Typed {
    private _isInput: boolean = null;
    private _strPos: number = 0;
    private _arrayPos: number = 0;
    private _stopNum: number = 0;
    private _curLoop: number = 0;
    private _sequence: number[] = [];
    private _timeout: number = null;
    private _cursor: HTMLElement = null;
    private _stop: boolean = false;
    private _stringsElement: HTMLElement = null;
    private _element: HTMLElement = null;
    private _options: TypedOptions = null;

    public constructor(selector: string, options: ITypedOptions | TypedOptions) {
        if(options instanceof TypedOptions)
        {
            this._options = options;
        }
        else {
            this._options = new TypedOptions(options);
        }


        let selection = document.querySelector(selector);
        if(selection instanceof HTMLElement){
            this._element = selection;
        }
        else{
            throw 'typed.ts: invalid element selection';
        }
        
        // attribute to type into
        this._isInput = this._element.tagName.toLowerCase() === 'input';


        // div containing strings
        if ($ && this._options.stringsElement instanceof $) {
            this._stringsElement = this._options.stringsElement[0]
        } else if (this._options.stringsElement instanceof HTMLElement) {
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


    private init(): void {
        // begin the loop w/ first current string (global this.strings)
        // current string will be passed as an argument each time after this
        this._timeout = setTimeout(() => {
            for (let i = 0; i < this._options.strings.length; ++i) {
                this._sequence[i] = i;
            }

            // shuffle the array if true
            if (this._options.shuffle) {
                this._sequence = this.shuffleArray(this._sequence);
            }

            // Start typing
            this.typewrite(this._options.strings[this._sequence[this._arrayPos]], this._strPos);
        }, this._options.startDelay);
    }

    public build() {
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
            let strings = Array.prototype.slice.apply(this._stringsElement.children);
            strings.forEach((stringElement: HTMLElement) => {
                this._options.strings.push(stringElement.innerHTML);
            });
        } 
        this.init();
    }

    // pass current string state to each function, types 1 char per call
    private typewrite(curString: string, curStrPos: number) {
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
        let humanize: number = Math.round(Math.random() * (100 - 30)) + this._options.typeSpeed;

        // ------------- optional ------------- //
        // backpaces a certain string faster
        // ------------------------------------ //
        // if (this.arrayPos == 1){
        //  this.backDelay = 50;
        // }
        // else{ this.backDelay = 500; }

        // contain typing function in a timeout humanize'd delay
        this._timeout = setTimeout(() => {
            // check for an escape character before a pause value
            // format: \^\d+ .. eg: ^1000 .. should be able to print the ^ too using ^^
            // single ^ are removed from string
            let charPause: number = 0;
            let substr: string = curString.substr(curStrPos);
            if (substr.charAt(0) === '^') {
                let skip = 1; // skip atleast 1
                if (/^\^\d+/.test(substr)) {
                    substr = /\d+/.exec(substr)[0];
                    skip += substr.length;
                    charPause = parseInt(substr);
                }

                // strip out the escape character and pause value so they're not printed
                curString = curString.substring(0, curStrPos) + curString.substring(curStrPos + skip);
            }

            if (this._options.contentType === 'html') {
                // skip over html tags while typing
                let curChar: string = curString.substr(curStrPos).charAt(0);
                if (curChar === '<' || curChar === '&') {
                    let tag: string = '';
                    let endTag: string = '';
                    if (curChar === '<') {
                        endTag = '>'
                    } else {
                        endTag = ';'
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
            this._timeout = setTimeout(() => {
                if (curStrPos === curString.length) {
                    // fires callback function
                    this._options.onStringTyped(this._arrayPos);

                    // is this the final string
                    if (this._arrayPos === this._options.strings.length - 1) {
                        // animation that occurs on the last typed string
                        this._options.callback();

                        this._curLoop++;

                        // quit if we wont loop back
                        if (this._options.loop === false || this._curLoop === this._options.loopCount)
                            return;
                    }

                    this._timeout = setTimeout(() => {
                        this.backspace(curString, curStrPos);
                    }, this._options.backDelay);

                } else {

                    /* call before functions if applicable */
                    if (curStrPos === 0) {
                        this._options.preStringTyped(this._arrayPos);
                    }

                    // start typing each new char into existing string
                    // curString: arg, this.el.html: original text inside element
                    let nextString = curString.substr(0, curStrPos + 1);
                    if (this._options.attr) {
                        this._element.setAttribute(this._options.attr, nextString);
                    } else {
                        if (this._element instanceof HTMLInputElement) {
                            this._element.value = nextString;
                        } else if (this._options.contentType === 'html') {
                            this._element.innerHTML = nextString;
                        } else {
                            this._element.textContent = nextString;
                        }
                    }

                    // add characters one by one
                    curStrPos++;
                    // loop the function
                    this.typewrite(curString, curStrPos);
                }
                // end of character pause
            }, charPause);

            // humanized value for typing
        }, humanize);

    }

    private backspace(curString: string, curStrPos: number) {
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
        let humanize: number = Math.round(Math.random() * (100 - 30)) + this._options.backSpeed;

        this._timeout = setTimeout(() => {

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

            if (this._options.contentType === 'html') {
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
            let nextString = curString.substr(0, curStrPos);
            this.replaceText(nextString);

            // if the number (id of character in current string) is
            // less than the stop number, keep going
            if (curStrPos > this._stopNum) {
                // subtract characters one by one
                curStrPos--;
                // loop the function
                this.backspace(curString, curStrPos);
            }
            // if the stop number has been reached, increase
            // array position to next string
            else if (curStrPos <= this._stopNum) {
                this._arrayPos++;

                if (this._arrayPos === this._options.strings.length) {
                    this._arrayPos = 0;

                    // Shuffle sequence again
                    if (this._options.shuffle) this._sequence = this.shuffleArray(this._sequence);

                    this.init();
                } else
                    this.typewrite(this._options.strings[this._sequence[this._arrayPos]], curStrPos);
            }

            // humanized value for typing
        }, humanize);

    }

    // Adds a CSS class to fade out current string
    private initFadeOut() {
        this._element.className += ' ' + this._options.fadeOutClass;
        this._cursor.className += ' ' + this._options.fadeOutClass;
        return setTimeout(() => {
            this._arrayPos++;
            this.replaceText('')
            this.typewrite(this._options.strings[this._sequence[this._arrayPos]], 0);
        }, this._options.fadeOutDelay);
    }

    // Replaces current text in the HTML element
    private replaceText(str) {
        if (this._options.attr) {
            this._element.setAttribute(this._options.attr, str);
        } else {
            if (this._element instanceof HTMLInputElement) {
                this._element.value = str;
            } else if (this._options.contentType === 'html') {
                this._element.innerHTML = str;
            } else {
                this._element.textContent = str;
            }
        }
    }

    // Shuffles the numbers in the given array.
    private shuffleArray(array) {
        let tmp, current, top = array.length;
        if (top) {
            while (--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = array[current];
                array[current] = array[top];
                array[top] = tmp;
            }
        }
        return array;
    }

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
    private reset() {
        clearInterval(this._timeout);
        let id = this._element.getAttribute('id');
        this._element.textContent = '';
        if (typeof this._cursor !== 'undefined' && typeof this._cursor.parentNode !== 'undefined') {
            this._cursor.parentNode.removeChild(this._cursor);
        }
        this._strPos = 0;
        this._arrayPos = 0;
        this._curLoop = 0;
        // Send the callback
        this._options.resetCallback();
    }
}

if ($) {
    $.fn.typed = (option) => {
        return this.each(() => {
            let $this = $(this),
                data = $this.data('typed'),
                options = typeof option == 'object' && option;
            if (data) {
                data.reset();
            }
            $this.data('typed', (data = new Typed(this, options)));
        });
    };
}