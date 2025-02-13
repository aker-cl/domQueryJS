//@ts-check

export const Reactive = {
    /**
     * Function to define a reactive variable
     * 
     * @param {String} variableName 
     * @param {any} initialValue 
     * @param {Function|null} callback 
     */
    def: (variableName, initialValue, callback = null) => {
        let variable = initialValue;

        const notifyChange = () => {
            const safeValue = Array.isArray(variable) ? [...variable] :
                            typeof variable === "object" ? { ...variable } :
                            variable;
            if (callback) callback(safeValue);
        };

        if (Array.isArray(variable)) {
            // Interceptar métodos de array que modifican su contenido
            ["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin", "toSpliced"].forEach(method => {
                const originalMethod = variable[method];
                variable[method] = function (...args) {
                    const result = originalMethod.apply(variable, args);
                    notifyChange();
                    return result;
                };
            });
        } else if (typeof variable === "object" && variable !== null) {
            // Usar Proxy para detectar cambios en propiedades de objetos
            variable = new Proxy(variable, {
                set(target, prop, value) {
                    target[prop] = value;
                    notifyChange();
                    return true;
                }
            });
        }

        Object.defineProperty(Reactive, variableName, {
            get() {
                return variable;
            },
            set(value) {
                variable = value;
                notifyChange();
                return value;
            }
        });

        // Inicializar la variable reactiva
        Reactive[variableName] = variable;
    }
};


/**
 * Function to define a reactive variable with getter and setter
 * 
 * @param {any} value 
 * @param {Function} callback 
 * @returns {Object}
 */
export const ReactiveV2 = (value, callback) => {
    let varValue = value;

    const notifyChange = () => {
        // Para los arrays, devolvemos una copia con spread [...varValue]
        // Para los objetos, devolvemos una copia con { ...varValue }
        const safeValue = Array.isArray(varValue) ? [...varValue] : 
                        typeof varValue === "object" ? { ...varValue } : 
                        varValue;
        callback(safeValue);
    };

    const wrapped = {
        get value() {
            return varValue;
        },
        set value(newValue) {
            varValue = newValue;
            notifyChange();
        }
    };

    if (Array.isArray(varValue)) {
        ["push", "pop", "shift", "unshift", "splice", "sort", "reverse", "fill", "copyWithin", "toSpliced"].forEach(method => {
            const originalMethod = varValue[method];
            varValue[method] = function (...args) {
                const result = originalMethod.apply(varValue, args);
                notifyChange();
                return result;
            };
        });
    } else if (typeof varValue === "object" && varValue !== null) {
        varValue = new Proxy(varValue, {
            set(target, prop, newValue) {
                target[prop] = newValue;
                notifyChange();
                return true;
            }
        });
    }

    return wrapped;
};






export function DOMquery(selector){
    return new DQ(selector);
}

class DQ {
    /**
     * 
     * @param {Array|Object|String} selector - Array, Object or String
     */
    constructor(selector){
        this.selector = selector
        this.searchAttributes = []
        this.conditions = new Set([
            '>',
            '<',
            '>=',
            '<=',
            '==',
            '!=',
            'between',
            'includes',
            '!includes'
        ])
    }

    #search(){
        /** @type {Object} */
        let results = []

        if (this.selector instanceof Object) {
            results = [this.selector] 
        }else if(this.selector instanceof Array){
            results = [...this.selector]
        }else{
            results = [...document.querySelectorAll(`${this.selector}`)]
        }

        const setResults = new Set()
        const attributes = {}

        for (const [name, vc, value] of this.searchAttributes) {
            if (!attributes[name])
                attributes[name] = []

            if(typeof vc == 'string' && this.conditions.has(vc))
                attributes[name].push({value: value, condition: vc}) 
            else
                attributes[name].push({value: vc})    
        }

        for (const res of results) {
            const valid = []

            if (Object.keys(attributes).length != 0) {
                for (const search of Object.entries(attributes)) {
                    const name = search[0]
                    const searchData = search[1]
                    for (const data of searchData) {
                        const value = isNaN(Number(data.value)) ? data.value : Number(data.value)
                        const condition = data.condition
                        const type = name.split('-')[0]
                        const dataset = name.split('-').slice(1).map((parte, index) => {                        
                            return index === 0 ? parte : parte.charAt(0).toUpperCase() + parte.slice(1);
                        }).join('')
                        
                        if (type == 'data') {
                            if (condition != undefined) {
                                if (this.#checkCondition(res.dataset[dataset], condition, value))
                                    valid.push(true)                                
                                else
                                    valid.push(false)                                                            
                            }else{
                                if (res.dataset[dataset] == data.value) 
                                    valid.push(true)                                
                                else
                                    valid.push(false)                                                        
                            }                        
                        }else if(name == 'class'){
                            if (condition == 'includes' && this.#elementHasClass(res, value)) {
                                valid.push(true)
                            }else if(condition == '!includes' && !this.#elementHasClass(res, value)){
                                valid.push(true)
                            }else{
                                valid.push(false)
                            }
                        }else{
                            if (condition != undefined ) {
                                if (this.#checkCondition(res[name], condition, value))
                                    valid.push(true)                                
                                else
                                    valid.push(false)                                                                                 
                            }else{
                                if (res[name] == data.value)
                                    valid.push(true)
                                else
                                    valid.push(false)
                            }
                        }
                    }                    
                }  
            }
            
            if (!valid.includes(false))
                setResults.add(res)
        }

        return [...setResults]
    }

    /**
     * Function to check if the condition is true or false
     * @param {any} value 
     * @param {String} condition 
     * @param {any} valueSearch 
     * @returns {boolean}
     */
    #checkCondition(value, condition, valueSearch){
        const typeValue = isNaN(Number(value)) ? value : Number(value)
        let result = false

        switch (condition) {
            case '>':
                result = typeValue > valueSearch
            case '<':
                result = typeValue < valueSearch
            case '>=':
                result = typeValue >= valueSearch
            case '<=':
                result =  typeValue <= valueSearch
            case '==':
                result = typeValue == valueSearch
            case '!=':
                result = typeValue != valueSearch
            case 'between':
                result = typeValue >= valueSearch[0] && typeValue <= valueSearch[1]
            case 'includes':
                result = valueSearch.includes(typeValue)
            case '!includes':
                result = !valueSearch.includes(typeValue)
        }

        return result
    }

    /**
     * Function to check if the element has the specified class
     * 
     * @param {String|Array} className The class name to check
     * 
     * @returns {Array<Boolean>|Boolean} if the search length is 1 it will return a boolean otherwise it will return an array of booleans
     */
    #elementHasClass(el, className) {
        const hasClassArray = 
        typeof className == 'string' ?
        el.classList.contains(className) : 
        className.some(name => el.classList.contains(name))

        if (hasClassArray.length == 1)
            return hasClassArray[0]
        return hasClassArray
    }

    /**
     * Function to handle the data attribute
     * 
     * @param {String} name 
     * 
     * @returns {String}
     */
    #handleDataAttribute(name) {
        const splitName = name.split('-')

        if (splitName[0] == 'data')
            return splitName.slice(1).join('-')
        return name
    }

    /**
     * Function to search for elements with the specified attributes
     * 
     * @param {String|Array} attributes attribute(s) to search
     * @param {String|Number|boolean|null} vc condition | value of attribute
     * @param {any} value value of attribute(s)
     * 
     * @returns {Object}
     */
    where(attributes, vc = null, value = null) {
        if (typeof attributes == 'object') {
            for (const [name, vc, value] of attributes) {
                this.searchAttributes.push([name, vc, value])
            }
        } else {
            this.searchAttributes.push([attributes, vc, value])
        }

        return this
    }
    
    /**
     * Function to add a class to the element
     * 
     * @param {Array<String>|String} className The class name to add
     * 
     * @returns {Object}
     */
    addClass(className) {
        const results = this.#search()

        results.forEach(el => {
            if (typeof className == 'string') {
                el.classList.add(className)
            }else{
                className.forEach(name => {
                    el.classList.add(name)
                })
            }
        })

        return this
    }

    /**
     * Function to remove a class from the element
     * 
     * @param {Array<String>|String} className The class name to add
     * 
     * @returns {Object}
     */
    removeClass(className) {
        const results = this.#search()

        results.forEach(el => {
            if (typeof className == 'string') {
                el.classList.remove(className)
            }else{
                className.forEach(name => {
                    el.classList.remove(name)
                })                
            }       
        })

        return this
    }

    /**
     * 
     * @param {Array<String>|String} className The class name to toggle
     * 
     * @returns {Object}
     */
    toggleClass(className) {
        const results = this.#search()

        results.forEach(el => {
            if (typeof className == 'string') {
                el.classList.toggle(className)
            }else{
                className.forEach(name => {
                    el.classList.toggle(name)
                })
            }
        })

        return this
    }

    /**
     * Function to check if the element has the specified class
     * 
     * @param {String|Array} className The class name to check
     * 
     * @returns {Array<Boolean>|Boolean} if the search length is 1 it will return a boolean otherwise it will return an array of booleans
     */
    hasClass(className) {
        const results = this.#search()

        const hasClassArray = 
        typeof className == 'string' ?
        results.map(el => el.classList.contains(className)) : 
        results.map(el => className.some(name => el.classList.contains(name)))

        if (hasClassArray.length == 1)
            return hasClassArray[0]
        return hasClassArray
    }

    /**
     * Function to check if the element has the specified class
     * 
     * @param {String|Array} className The class name to check
     * 
     * @returns {Array<Boolean>|Boolean} if the search length is 1 it will return a boolean otherwise it will return an array of booleans
     */
    elementHasClass(el, className) {
        const hasClassArray = 
        typeof className == 'string' ?
        el.classList.contains(className) : 
        className.some(name => el.classList.contains(name))

        if (hasClassArray.length == 1)
            return hasClassArray[0]
        return hasClassArray
    }

    /**
     * Function to set the style of the element
     * 
     * @param {Object|String} styles 
     * @param {String|null} value
     * 
     * @returns {Object}
     */
    setStyle(styles, value = null) {
        const results = this.#search()

        results.forEach(el => {
            if (typeof styles == 'string') {
                el.style[styles] = value
            }else{
                for (const [name, value] of Object.entries(styles)) {
                    el.style[name] = value
                }
            }            
        })

        return this
    }

    /**
     * 
     * @param {String} listener 
     * @param {Function} callback the callback return the elements and the element that triggered the event
     * 
     * @returns {Object}
     */
    addListener(listener, callback) {
        const results = this.#search()
        const listeners = listener.split('|').filter(Boolean)

        results.forEach(el => {
            listeners.forEach(newListener => {
                el.addEventListener(newListener, e => callback(e, el, results))
            })
            
        })

        return this
    }

    /**
     * Function to get the element or elements
     * 
     * @param {Number|Function|null} indexOrCallback Index of the element to get or a callback function
     * 
     * @returns {Array<HTMLElement>|HTMLElement|any}
     */
    get(indexOrCallback = null) {
        const results = this.#search()

        if (typeof indexOrCallback == 'function') {
            return indexOrCallback(results)
        }else{
            if (indexOrCallback != null)
                return results[indexOrCallback]
            return results
        }           
    }

    /**
     * Function to get the first element
     * 
     * @returns {Object}
     */
    first() {
        const results = this.#search()

        return results[0]
    }

    /**
     * Function to get the last element
     * 
     * @returns {Object}
     */
    last() {
        const results = this.#search()

        return results[results.length - 1]
    }

    /**
     * Function to set the attributes of the element
     * 
     * @param {Object|Function} attrsOrCallback Object with attributes to set or a callback function.
     * @param {Array|null} events The events to trigger after setting the attributes
     * 
     * @returns {Object|Array<HTMLElement>}
     */
    set(attrsOrCallback, events = null) {
        const results = this.#search()

        if (typeof attrsOrCallback == 'function') {
            attrsOrCallback(results)
        }else{
            results.forEach(el => {
                for (const [name, value] of Object.entries(attrsOrCallback)) {
                    const handledName = this.#handleDataAttribute(name)

                    if (handledName !== name)
                        el.dataset[handledName] = value
                    else
                        el[name] = value            

                    if (events) {
                        for (const event of events) {
                            const e = new Event(event)
                            el.dispatchEvent(e)
                        }                        
                    }                    
                }
            })

            return this
        }            
    }

    /**
     * 
     * @param {String} html 
     * 
     * @returns {Object}
     */
    setHtml(html){
        const results = this.#search()

        results.forEach(el => {
            el.innerHTML = html
        })

        return this
    }

    /**
     * 
     * @returns {Array}
     */
    getHtml(){
        const results = this.#search()
        const array = []


        results.forEach(el => {
            array.push({
                id: el.id ?? '',
                class: el.className ?? '',
                html: el.innerHTML
            })
        })

        return array
    }

    /**
     * 
     * @param {String} text 
     * 
     * @returns {Object}
     */
    setText(text){
        const results = this.#search()

        results.forEach(el => {
            el.innerText = text
        })

        return this
    }

    /**
     * 
     * @returns {Array}
     */
    getText(){
        const results = this.#search()
        const array = []  

        results.forEach(el => {
            array.push({
                id: el.id ?? '',
                class: el.className ?? '',
                text: el.innerText
            })
        })

        return array
    }

    /**
     * 
     * @param {String} content 
     * 
     * @returns {Object}
     */
    setContent(content){
        const results = this.#search()

        results.forEach(el => {
            el.textContent = content
        })

        return this
    }

    /**
     * 
     * @returns {Object}
     */
    getContent(){
        const results = this.#search()
        const array = []

        results.forEach(el => {
            array.push({
                id: el.id ?? '',
                class: el.className ?? '',
                content: el.textContent
            })
        })

        return array
    }

    /**
     * 
     * @param {boolean} action true | false
     * 
     * @returns {Object}
     */
    hide(action){
        const results = this.#search()

        results.forEach(el => {
            el.hidden = action
        })

        return this
    }

    /**
     * 
     * @returns {Object}
     */
    remove(){
        const results = this.#search()

        results.forEach(el => {
            el.remove()
        })

        return this
    }

    /**
     * 
     * @param {String|Object} elementOrHtml 
     * 
     * @returns {Object}
     */
    append(elementOrHtml){
        const results = this.#search()

        results.forEach(el => {
            if (typeof elementOrHtml == 'string') {
                el.innerHTML += elementOrHtml
            }else{
                el.append(elementOrHtml)
            }
        })

        return this
    }

    /**
     * 
     * @param {String|Object} elementOrHtml 
     * 
     * @returns {Object}
     */
    prepend(elementOrHtml){
        const results = this.#search()

        results.forEach(el => {
            if (typeof elementOrHtml == 'string') {
                el.innerHTML = elementOrHtml + el.innerHTML
            }else{
                el.prepend(elementOrHtml)
            }
        })

        return this
    }

    /**
     * 
     * @param {String|Object} elementOrHtml 
     * @param {Number} position
     * 
     * @returns {Object}
     */
    insert(elementOrHtml, position){
        const results = this.#search()

        results.forEach(el => {
             // Si el índice es mayor que el número de hijos, el nuevo `div` se añade al final.
            if (position >= el.children.length) {
                if (typeof elementOrHtml == 'string') {
                    el.insertAdjacentHTML('beforeend', elementOrHtml);
                }else{
                    el.appendChild(elementOrHtml);
                }               
            } else {
                if (typeof elementOrHtml == 'string') {
                    const referenceNode = el.children[position];
                    el.insertAdjacentHTML('beforebegin', elementOrHtml);
                    el.insertBefore(el.lastElementChild, referenceNode);
                }else{
                    el.insertBefore(elementOrHtml, el.children[position]);
                }            
            }            
        })

        return this
    }

    /**
     * 
     * @param {String|Object} elementOrHtml 
     * 
     * @returns {Object}
     */

    after(elementOrHtml){
        const results = this.#search()

        results.forEach(el => {
            if (typeof elementOrHtml == 'string') {
                el.insertAdjacentHTML('afterend', elementOrHtml)
            }else{
                el.insertAdjacentElement('afterend', elementOrHtml)
            }
        })

        return this
    }

    /**
     * 
     * @param {String|Object} elementOrHtml 
     * 
     * @returns {Object}
     */
    before(elementOrHtml){
        const results = this.#search()

        results.forEach(el => {
            if (typeof elementOrHtml == 'string') {
                el.insertAdjacentHTML('beforebegin', elementOrHtml)
            }else{
                el.insertAdjacentElement('beforebegin', elementOrHtml)
            }
        })

        return this
    }
}