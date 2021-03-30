// global CSS
import globalCss from "./style.css";
// CSS modules
import styles, { stylesheet } from "./style.module.css";

let inProgress = false;

function shortWait() {
  return new Promise((resolve) => {
    let waitTime = 200;
    setTimeout(() => {
      resolve(waitTime);
    }, waitTime);
  });
}

export async function init() {
  console.log("preparing CrowdinCrawler...");

  let toolbarSelector = "#editor-header .pull-right > .btn-toolbar";

  while (document.querySelector(toolbarSelector) == null) {
    await shortWait();
  }

  let $crawlerButton = $(
    '<button id="action-crawler" title="Translation Crawler" class="btn btn-icon"></button>'
  );

  $crawlerButton.append('<i class="static-icon-task"></i>');
  $(toolbarSelector).append($crawlerButton);

  $("#action-crawler").on("click", () => {
    runCrawlerTask();
  });
}

async function runCrawlerTask() {
  if (inProgress == true) {
    return;
  }
  console.log("start working...");
  inProgress = true;
  $("#action-crawler").prop("disabled", true);
  let transData = [];
  let hasMoreJob = true;

  while (hasMoreJob) {
    if ($("#next_page").prop("disabled")) {
      console.log("last page...");
      await listJob(transData);
      printResult(transData);
      hasMoreJob = false;
    } else {
      await listJob(transData);
      $("#next_page").trigger("click");
      await shortWait();
      while ($("#loading_block").css("display") != "none") {
        await shortWait();
      }
    }
  }

  inProgress = false;
  $("#action-crawler").prop("disabled", false);
}

async function listJob(transData) {
  console.log("doing jobs...");
  let textListLength = $("#texts_list li").length;
  for (let index = 0; index < textListLength; index++) {
    $("#texts_list li").eq(index).trigger("mousedown");
    for (let i = 0; i < 10; i++) {
      await shortWait();
      if (
        $("#source_phrase_container").text() ==
        $("#texts_list li").eq(index).text()
      ) {
        transData.push([
          $("#source_context_container > div").text(),
          $("#texts_list li").eq(index).text(),
          $("#translation").val(),
        ]);
        break;
      }
    }
  }
}

function printResult(data) {
  $("body").append(resultTable(data));
  $("#translate-data-container")
    .contents()
    .filter((_, elem) => {
      return elem.nodeType == Node.TEXT_NODE;
    })
    .remove();
  $("#translation-data-close").on("click", () => {
    $("#translation-data-panel").remove();
  });
  console.log(data);
}

function resultTable(tableContent) {
  return (
    <>
      <div
        class="ui-dialog ui-widget ui-widget-content ui-corner-all ui-draggable ui-dialog-buttons"
        id="translation-data-panel"
        tabindex="-1"
        role="dialog"
        aria-labelledby="ui-id-9999"
      >
        <div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix">
          <span id="ui-id-9999" class="ui-dialog-title">
            Result
          </span>
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
              {tableContent.map((row, i) =>
              <tr key={i}>
                <td>{row[0]}</td>
                <td>{row[1]}</td>
                <td>{row[2]}</td>
              </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{globalCss}</style>
      <style>{stylesheet}</style>
    </>
  );
}
