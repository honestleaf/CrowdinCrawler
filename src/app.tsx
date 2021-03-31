// global CSS
import globalCss from './style.css'
// CSS modules
import styles, { stylesheet } from './style.module.css'

let inProgress = false

function shortWait() {
  return new Promise((resolve) => {
    let waitTime = 200
    setTimeout(() => {
      resolve(waitTime)
    }, waitTime)
  })
}

export async function init() {
  console.log('preparing CrowdinCrawler...')

  let toolbarSelector = '#editor-header .pull-right > .btn-toolbar'

  while (document.querySelector(toolbarSelector) == null) {
    await shortWait()
  }

  let $crawlerButton = $(
    '<button id="action-crawler" title="Translation Crawler" class="btn btn-icon"></button>',
  )

  $crawlerButton.append('<i class="static-icon-task"></i>')
  $(toolbarSelector).append($crawlerButton)

  bindAction()
}

function bindAction() {
  $('body').on('click', '#action-crawler', () => {
    runCrawlerTask()
  })

  $('body').on('copy', '#copy-container', (event) => {
    const selection = getSelection()
    if (selection.isCollapsed) return
    event.preventDefault()
    const dataAsText = window.getSelection().toString()
    const dataAsHtml = $('<div></div>')
      .append(selection.getRangeAt(0).cloneContents())
      .html()
    const clipboardData = event.originalEvent['clipboardData']
    clipboardData.setData('text/plain', dataAsText)
    clipboardData.setData('text/html', brTagCopyFix(dataAsHtml))
  })

  $('body').on('click', '#translation-data-close', () => {
    $('#translation-data-panel').remove()
  })

  $('body').on('click', '#action-copy-table', () => {
    copyFormatted($('#translate-data-container').html())
  })
}

function copyFormatted(html) {
  // Create container for the HTML
  // [1]
  var container = document.createElement('div')
  container.innerHTML = html

  // Hide element
  // [2]
  container.id = 'copy-container'
  container.style.position = 'fixed'
  container.style.pointerEvents = 'none'
  container.style.opacity = '0'

  // Detect all style sheets of the page
  var activeSheets = Array.prototype.slice
    .call(document.styleSheets)
    .filter(function (sheet) {
      return !sheet.disabled
    })

  // Mount the container to the DOM to make `contentWindow` available
  // [3]
  document.body.appendChild(container)

  // Copy to clipboard
  // [4]
  window.getSelection().removeAllRanges()

  var range = document.createRange()
  range.selectNode(container)
  window.getSelection().addRange(range)

  // [5.1]
  document.execCommand('copy')

  // [5.2]
  for (var i = 0; i < activeSheets.length; i++) activeSheets[i].disabled = true

  // [5.3]
  document.execCommand('copy')

  // [5.4]
  for (var i = 0; i < activeSheets.length; i++) activeSheets[i].disabled = false

  // Remove the container
  // [6]
  document.body.removeChild(container)
}

async function runCrawlerTask() {
  if (inProgress == true) {
    return
  }
  console.log('start working...')
  inProgress = true
  $('#action-crawler').prop('disabled', true)
  let transData = []
  let hasMoreJob = true

  while (hasMoreJob) {
    if ($('#next_page').prop('disabled')) {
      console.log('last page...')
      await listJob(transData)
      printResult(transData)
      hasMoreJob = false
    } else {
      await listJob(transData)
      $('#next_page').trigger('click')
      await shortWait()
      while ($('#loading_block').css('display') != 'none') {
        await shortWait()
      }
    }
  }

  inProgress = false
  $('#action-crawler').prop('disabled', false)
}

async function listJob(transData) {
  console.log('doing jobs...')
  let textListLength = $('#texts_list li').length
  for (let index = 0; index < textListLength; index++) {
    $('#texts_list li').eq(index).trigger('mousedown')
    for (let i = 0; i < 10; i++) {
      await shortWait()
      if (
        $('#source_phrase_container').text() ==
        $('#texts_list li').eq(index).text()
      ) {
        transData.push([
          $('#source_context_container > div').text(),
          $('#texts_list li').eq(index).text(),
          $('#translation').val().toString(),
        ])
        break
      }
    }
  }
}

function printResult(data) {
  $('body').append(resultTable(data))
  $('#translate-data-container')
    .contents()
    .filter((_, elem) => {
      return elem.nodeType == Node.TEXT_NODE
    })
    .remove()
}

function brTagCopyFix(htmlContent: String) {
  const lineBreakRegex = /\r\n|\r|\n/g
  return htmlContent.replace(
    lineBreakRegex,
    '<br style="mso-data-placement:same-cell;" />',
  )
}

function resultTable(tableContent: Array<Array<String>>) {
  return (
    <>
      <div
        class="ui-dialog ui-widget ui-widget-content ui-corner-all ui-dialog-buttons"
        id="translation-data-panel"
        tabindex="-1"
        role="dialog"
        aria-labelledby="ui-id-9999"
      >
        <div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix">
          <span id="ui-id-9999" class="ui-dialog-title">
            Result
          </span>
          <button
            id="action-copy-table"
            tabindex="-1"
            title="Copy Table to Clipboard"
            class="btn btn-icon ui-dialog-titlebar-copy"
          >
            <i class="static-icon-copy-source"></i>
          </button>
          <a
            href="#"
            class="ui-dialog-titlebar-close ui-corner-all"
            role="button"
          >
            <span
              id="translation-data-close"
              class="ui-icon ui-icon-closethick"
            >
              close
            </span>
          </a>
        </div>
        <div
          class="hide ui-dialog-content ui-widget-content"
          id="translate-data-container"
        >
          <table
            class="table thead table-condensed no-margin"
            id="translation-data-table"
          >
            <tbody>
              <tr>
                <th>Context</th>
                <th>Source</th>
                <th>Translation</th>
              </tr>
              {tableContent.map((row, i) => (
                <tr key={i}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{globalCss}</style>
      <style>{stylesheet}</style>
    </>
  )
}
