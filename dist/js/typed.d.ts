/// <reference types="jquery" />
interface TypedElement extends HTMLElement {
    _typed: Typed;
}
interface ITypedOptions {
    strings: string[];
    stringsElement?: HTMLElement;
    stringsElementSelector?: JQuery;
    typeSpeed?: number;
    startDelay?: number;
    backSpeed?: number;
    shuffle?: boolean;
    backDelay?: number;
    fadeOut?: boolean;
    fadeOutClass?: string;
    fadeOutDelay?: number;
    loop?: boolean;
    loopCount?: number;
    showCursor?: boolean;
    cursorChar?: string;
    attr?: string;
    contentType?: 'html' | 'text';
    callback?: () => void;
    preStringTyped?: (arrayPos?: number) => void;
    onStringTyped?: (arrayPos?: number) => void;
    resetCallback?: () => void;
}
declare class TypedOptions implements ITypedOptions {
    strings: string[];
    stringsElement: HTMLElement;
    stringsElementSelector: JQuery;
    typeSpeed: number;
    startDelay: number;
    backSpeed: number;
    shuffle: boolean;
    backDelay: number;
    fadeOut: boolean;
    fadeOutClass: string;
    fadeOutDelay: number;
    loop: boolean;
    loopCount: number;
    showCursor: boolean;
    cursorChar: string;
    attr: string;
    contentType: 'html' | 'text';
    callback: () => void;
    preStringTyped: (arrayPos?: number) => void;
    onStringTyped: (arrayPos?: number) => void;
    resetCallback: () => void;
    constructor(options?: ITypedOptions);
}
declare class Typed {
    private _isInput;
    private _strPos;
    private _arrayPos;
    private _stopNum;
    private _curLoop;
    private _sequence;
    private _timeout;
    private _cursor;
    private _stop;
    private _stringsElement;
    private _element;
    private _options;
    constructor(selector: string, options: ITypedOptions | TypedOptions);
    private init();
    build(): void;
    private typewrite(curString, curStrPos);
    private backspace(curString, curStrPos);
    private initFadeOut();
    private replaceText(str);
    private shuffleArray(array);
    private reset();
}
