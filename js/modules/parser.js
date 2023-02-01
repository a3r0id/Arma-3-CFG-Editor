// // Arma 3 Config Parser by A3RO // //
// ---------------------------------- //
// supported variable types:          //
// ---------------------------------- //
// string (single/double quotes)      //
// integer/float                      //
// boolean                            //
// array                              //
// class + nested classes             //
// ---------------------------------- //
// NOT ALLOWED FOR COMMERICAL USE !!! //
// ---------------------------------- //

export class ConfigParser
{
    constructor(text, onInvalidChars = ()=>{}){

        this.text   = text; // raw text
        this.buffer = text; // raw text - stripped, to be parsed/subtracted from
        this.onInvalidChars = onInvalidChars;
        
        this.cleanupStrings = function(compressedString){
            // see if any string matches the compressed string when compressed, if so, return the string uncompressed
            for (let m of this.text.match(/(["'])(?:(?=(\\?))\2.)*?\1/g)){
                if (m.replaceAll(' ', '') === "\"" + compressedString + "\"" | m.replaceAll(' ', '') === "'" + compressedString + "'"){
                    // remove first and last character (quotes)
                    return m.substring(1, m.length - 1);
                }
            }
            return compressedString.substring(1, compressedString.length - 1);
        }

        // remove junk
        for (let r of [
            /\/\/.*/g, // single line comments
            /\/\*[\s\S]*?\*\//g, // multi-line comments
            /[\s]+/g, // whitespace
        ]) this.buffer  = this.buffer.replace(r, '');  // raw text - stripped

        // CHECKS //
        this.checkForString = function(text){
            let parsedChunk = text.split(';')[0];
            if (!parsedChunk.includes("=")) return false;
            let retVal = []; // [0] = is variable, [1] = string value, [2] = text to remove from main text
            if (parsedChunk.includes("=")){
                retVal.push(parsedChunk.split('=')[0]);
            }
            if (parsedChunk.split('=')[1].indexOf('"') === 0){
                retVal.push(parsedChunk.split('=')[1].split('"')[1]);
                retVal.push(parsedChunk + ';');
                retVal[1] = this.cleanupStrings(retVal[1]);
                return retVal;
            } else if (parsedChunk.split('=')[1].indexOf("'") === 0){
                retVal.push(parsedChunk.split('=')[1].split("'")[1]);
                retVal.push(parsedChunk + ';');
                retVal[1] = this.cleanupStrings(retVal[1]);
                return retVal;
            }
            return false;
        }

        this.checkForInt = function(text){
            let parsedChunk = text.split(';')[0];
            if (!parsedChunk.includes("=")) return false;
            let retVal = []; // [0] = is variable, [1] = int value, [2] = text to remove from main text
            if (parsedChunk.includes("=")){
                retVal.push(parsedChunk.split('=')[0]);
            }
            if (!isNaN(parsedChunk.split('=')[1])){
                retVal.push(parseInt(parsedChunk.split('=')[1]));
                retVal.push(parsedChunk + ';');
                return retVal;
            }
            return false;
        }

        this.checkForBool = function(text){
            let parsedChunk = text.split(';')[0];
            if (!parsedChunk.includes("=")) return false;
            let retVal = []; // [0] = is variable, [1] = bool value, [2] = text to remove from main text
            if (parsedChunk.includes("=")){
                retVal.push(parsedChunk.split('=')[0]);
            }
            if (parsedChunk.split('=')[1] === 'true' || parsedChunk.split('=')[1] === 'false'){
                retVal.push(parsedChunk.split('=')[1] === 'true');
                retVal.push(parsedChunk + ';');
                return retVal;
            }
            return false;
        }

        this.checkForArray = function(text){
            let parsedChunk = text.split(';')[0];
            if (!parsedChunk.includes("=")) return false;
            if (!parsedChunk.split("=")[0].includes("[]")) return false;
            let retVal = []; // [0] = is variable, [1] = array value, [2] = text to remove from main text
            retVal.push(parsedChunk.split('=')[0]);
            let array = JSON.parse(parsedChunk.split('=')[1].replaceAll('{', '[').replaceAll('}', ']'));
            retVal.push(array);
            retVal.push(parsedChunk + ';');
            return retVal;
        }

        // ACCOUNTER //
        this.accountForChecks = function(searchResult){
            if (searchResult){
                let varName = searchResult[0];
                let varVal  = searchResult[1];
                let varText = searchResult[2];
                if (this.parsingClass){
                    this.addToCurrentClassScope(varName, varVal);
                } else {
                    this.config[varName] = varVal;
                }
                this.buffer = this.buffer.replace(varText, '');
            }
        };

        // CLASS BUILDER //
        this.addToCurrentClassScope = function(variableName, variableValue)
        {
            let isClass = false;                                                // is the variable a class to be nested?
            if (typeof variableValue === 'object' && variableValue !== null){   // if variable is a class, add it to the config object
                isClass = true;                                                 // set the isClass flag to true
            }
            if (this.currentClassnames.length === 0){                           // if class name hierarchy is empty, return with error (this should never happen)
                console.error('Error: Cannot add variable to class scope when no class is being parsed.');
                return;
            } 
            this.config = setProperty(this.config, this.currentClassnames.join('.') + '.' + variableName, variableValue); 
        }
        
        // UTILITIES //
        const setProperty = (obj, path, value) => {
            const [head, ...rest] = path.split('.') // split path into head and tail
            return { // return new object with updated value at path
                ...obj,
                [head]: rest.length
                    ? setProperty(obj[head], rest.join('.'), value)
                    : value
            }
        }             

        // PARSER //
        this.config             = {};                                                                   // config object
        let safteyMax           = 1000;                                                                 // max number of iterations to prevent infinite loops
        let saftey              = 0;                                                                    // current iteration
        this.parsingClass       = false;                                                                // are we in class parsing mode?
        this.currentClassnames  = [];                                                                   // heirarchial array of current class names        

        while (this.buffer.length > 0 && saftey < safteyMax)
        {

            // parse classes
            if (this.buffer.indexOf('class') === 0)
            {
                let isNested = false;                                                                   // is this a nested class?
                (this.parsingClass) ? isNested = true : null;                                           // if we are already parsing a class, then we are parsing a nested class
                this.parsingClass = true;                                                               // we are now parsing a class, so set the flag even if we are already parsing a class (nested class)
                let className = this.buffer.split("class")[1].split("{")[0];                            // split the file text @ "class" into the rest of the file
                (isNested) ? this.addToCurrentClassScope(className, {}) : this.config[className] = {};  // add the class to the config object
                this.currentClassnames.push(className);                                                 // add the class name to the heirarchy - nested classes will be added to the last class in the array
                this.buffer = this.buffer.replace("class" + className + "{", '');                       // remove the class name and the opening bracket from the file text    
            } else if (this.buffer.indexOf("};") === 0 && this.parsingClass) { 
                (this.currentClassnames.length === 0) ? this.parsingClass = false : null                // end parsing the class
                this.currentClassnames.pop();                                                           // shift back one class - or end parsing the top level class
                this.buffer = this.buffer.replace("};", '');                                            // remove the closing bracket from the file text
            } else {
                this.accountForChecks(this.checkForString(this.buffer));                                // parse strings
                this.accountForChecks(this.checkForInt(this.buffer));                                   // parse ints
                this.accountForChecks(this.checkForBool(this.buffer));                                  // parse bools
                this.accountForChecks(this.checkForArray(this.buffer));                                 // parse arrays
            }     
            
            if (this.currentClassnames.length === 0) this.parsingClass = false;
            
            saftey++;
        }
        if (this.buffer.length > 0) onInvalidChars();                                                 // if there is still text in the buffer, then there are invalid characters
    }
}