# DomQueryJS

This function allows to search, modify or delete DOM objects using advanced queries.

## _Use examples_

```js
import { DOMquery } from 'teseract-domqueryjs'

// for first element
const test = DOMquery('#test').first() || DOMquery('.test').first()

// for last element
const test = DOMquery('.test').last()

// for all element
const test = DOMquery('.test').get()

// get with index
const test = DOMquery('.test').get(3)

// get with callback
const test = DOMquery('.test').get(elements => {
    console.log(elements)
})

// where conditions

const test = DOMquery('.test')
.where('required', true)
.where('data-type', 1)
.where('data-type', 'includes', [1,2])
.where('data-type', '!includes', [3,4])
.where([
    ['data-type', '>=', 1],
    ['data-type', '<', 5]
])
.where('value', '!=', 0)
.get()

// other functions

DOMquery('.test')
.addClass('class-one')
.addClass(['class-two', 'class-three'])
.removeClass('class-four')
.toggleClass('class-five')
.setStyle('textColor', 'red')
.setStyle({
    textColor: 'blue',
    marginTop: '2rem'
})


// add one or more listeners
DOMquery('.test').addListener('keyup|change', (e, el, elements) => {
    console.log({e, el, elements})
})

// verify a class and return true or false
const test = DOMquery('#test').hasClass('class-one')
const test = DOMquery('#test').hasClass(['class-one', 'class-four'])

// set attributes
DOMquery('.test').set('hidden', true)

DOMquery('.test')
.set({
    hidden: false,
    'data-type': 3
})

const f = element => {
    element.type = 'password'
}

// set a function
DOMquery('.test').set(f)

// set a function with a event
DOMquery('.test').set(f, 'change')

// set HTML 
DOMquery('.test').setHtml('<h1>Hello world!</h1>')

// return array of objects wih id, class and html
DOMquery('.test').getHtml()

DOMquery('.test').setText('Hello world!')
DOMquery('.test').getText()

DOMquery('.test').setContent('Hello world!')
DOMquery('.test').getContent()

DOMquery('.test').hide()
DOMquery('.test').remove()

const span = document.createElement('span')
span.textContent = 'Hello world!'

// append a html string or a element
DOMquery('.test').append('<span>Hello world!</span>')

// prepend a html string or a element
DOMquery('.test').prepend(span)

// insert a html string or a element in specific position
DOMquery('.test').insert(span, 3)

// insert a html string or a element after the element
DOMquery('.test').after(span)

// insert a html string or a element before the element
DOMquery('.test').before(span)
```