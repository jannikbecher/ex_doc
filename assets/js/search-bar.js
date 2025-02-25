import {
  hideAutocompleteList,
  isAutocompleteListOpen,
  moveAutocompleteSelection,
  selectedAutocompleteSuggestion,
  updateAutocompleteList,
  AUTOCOMPLETE_CONTAINER_SELECTOR,
  AUTOCOMPLETE_SUGGESTION_SELECTOR
} from './autocomplete/autocomplete-list'
import { qs } from './helpers'

const SEARCH_INPUT_SELECTOR = 'form.search-bar input'
const SEARCH_CLOSE_BUTTON_SELECTOR = 'form.search-bar .search-close-button'

/**
 * Initializes the sidebar search box.
 */
export function initialize () {
  addEventListeners()
}

/**
 * Sets the search input value.
 *
 * @param {String} value
 */
export function setSearchInputValue (value) {
  const searchInput = qs(SEARCH_INPUT_SELECTOR)
  searchInput.value = value
}

/**
 * Focuses the search input.
 */
export function focusSearchInput () {
  const searchInput = qs(SEARCH_INPUT_SELECTOR)
  searchInput.focus()
}

function addEventListeners () {
  const searchInput = qs(SEARCH_INPUT_SELECTOR)

  searchInput.addEventListener('keydown', event => {
    const macOS = isMacOS()

    if (event.key === 'Escape') {
      clearSearch()
      searchInput.blur()
    } else if (event.key === 'Enter') {
      handleAutocompleteFormSubmission(event)
    } else if (event.key === 'ArrowUp' || (macOS && event.ctrlKey && event.key === 'p')) {
      moveAutocompleteSelection(-1)
      event.preventDefault()
    } else if (event.key === 'ArrowDown' || (macOS && event.ctrlKey && event.key === 'n')) {
      moveAutocompleteSelection(1)
      event.preventDefault()
    }
  })

  searchInput.addEventListener('input', event => {
    updateAutocompleteList(event.target.value)
  })

  searchInput.addEventListener('focus', event => {
    document.body.classList.add('search-focused')
    updateAutocompleteList(event.target.value)
  })

  searchInput.addEventListener('blur', event => {
    const relatedTarget = event.relatedTarget

    if (relatedTarget) {
      // If blur is triggered caused by clicking on an autocomplete result,
      // then ignore it, because it's handled in the click handler below.
      if (relatedTarget.matches(AUTOCOMPLETE_SUGGESTION_SELECTOR)) {
        // Focus the input after a while, so that it's easier to close
        // or get back to after an accidental blur
        setTimeout(() => {
          if (isAutocompleteListOpen()) {
            searchInput.focus()
          }
        }, 1000)
        return null
      }

      if (relatedTarget.matches(SEARCH_CLOSE_BUTTON_SELECTOR)) {
        clearSearch()
      }
    }

    hideAutocomplete()
  })

  qs(AUTOCOMPLETE_CONTAINER_SELECTOR).addEventListener('click', event => {
    const newWindowKeyDown = (event.shiftKey || event.ctrlKey)
    if (newWindowKeyDown) {
      searchInput.focus()
    } else {
      clearSearch()
      hideAutocomplete()
    }
  })
}

function handleAutocompleteFormSubmission (event) {
  const searchInput = qs(SEARCH_INPUT_SELECTOR)
  const newWindowKeyDown = (event.shiftKey || event.ctrlKey)
  const autocompleteSuggestion = selectedAutocompleteSuggestion()

  event.preventDefault()

  const target = newWindowKeyDown ? '_blank' : '_self'
  const anchor = document.createElement('a')

  anchor.setAttribute('target', target)

  if (autocompleteSuggestion) {
    anchor.setAttribute('href', autocompleteSuggestion.link)
  } else {
    anchor.setAttribute('href', `search.html?q=${encodeURIComponent(searchInput.value)}`)
  }

  anchor.click()

  if (!newWindowKeyDown) {
    clearSearch()
    hideAutocomplete()
  }
}

function clearSearch () {
  const input = qs(SEARCH_INPUT_SELECTOR)
  input.value = ''
}

function hideAutocomplete () {
  document.body.classList.remove('search-focused')
  hideAutocompleteList()
}

function isMacOS () {
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)
}

let lastScrollTop = window.scrollY
const topSearch = document.querySelector('.top-search')
const sidebarMenu = document.getElementById('sidebar-menu')
const backgroundLayer = document.querySelector('.background-layer')
const scrollThreshold = 70 // Set a threshold for scroll, adjust as needed

window.addEventListener('scroll', function () {
  const currentScroll = window.scrollY

  // Add 'fixed' class when not at the top
  if (currentScroll > scrollThreshold * 2) {
    topSearch.classList.add('sm-fixed')
    sidebarMenu.classList.add('sm-fixed')
    backgroundLayer.classList.add('sm-fixed')
  }

  if (currentScroll === 0) {
    // Remove 'fixed' class when at the top
    topSearch.classList.remove('sm-fixed')
    sidebarMenu.classList.remove('sm-fixed')
    backgroundLayer.classList.remove('sm-fixed')
  }

  if (currentScroll > lastScrollTop && currentScroll > scrollThreshold) {
    // Scrolling down and past the threshold
    topSearch.classList.add('sm-hidden')
    sidebarMenu.classList.add('sm-hidden')
    backgroundLayer.classList.add('sm-hidden')
  } else {
    // Scrolling up or at the top of the page
    topSearch.classList.remove('sm-hidden')
    sidebarMenu.classList.remove('sm-hidden')
    backgroundLayer.classList.remove('sm-hidden')
  }

  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll
}, false)
