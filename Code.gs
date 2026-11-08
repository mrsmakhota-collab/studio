/**
 * Штаб винахідника - приймач прогресу і дашборд у Google Таблиці.
 * 1) Розширення -> Apps Script, вставити цей код, зберегти.
 * 2) Вибрати функцію setup -> Виконати (дозволити доступ).
 * 3) Розгорнути -> Нове розгортання -> Веб-застосунок:
 *    Виконувати як: Я; Доступ: Будь-хто. Скопіювати URL .../exec
 * 4) Вставити URL у застосунку: вкладка "Для батьків" -> Google Таблиця.
 */
var SKILL = { m: 'Математика', e: 'Інженерія', k: 'Критичне мислення' };
var LOG_HEADERS = ['ID', 'Дата', 'Час', 'Навичка', 'Тип задачі', 'Рівень', 'Правильно', 'Секунд', 'Дитина'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sh = getSheet_('Log');
    var last = sh.getLastRow();
    var ids = {};
    if (last > 1) sh.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { ids[String(r[0])] = true; });
    var rows = (data.rows || []).filter(function (r) { return r && r.id && !ids[String(r.id)]; }).map(function (r) {
      return [String(r.id), new Date(r.d + 'T12:00:00'), new Date(r.t), SKILL[r.s] || r.s, r.k || '', Number(r.L) || 0, r.ok ? 1 : 0, Number(r.sec) || 0, data.child || ''];
    });
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, LOG_HEADERS.length).setValues(rows);
    return json_({ ok: true, added: rows.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return json_({ ok: true, app: 'Штаб винахідника' }); }

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = getSheet_('Log');
  log.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]).setFontWeight('bold');
  log.setFrozenRows(1);
  log.getRange('B:B').setNumberFormat('yyyy-mm-dd');
  log.getRange('C:C').setNumberFormat('yyyy-mm-dd hh:mm');

  // Допоміжні розрахунки для графіків
  var calc = getSheet_('Calc');
  calc.clear();
  calc.getRange('A1').setFormula('=IFERROR(QUERY(Log!B:H,"select B, avg(G) where B is not null group by B pivot D label B \'Дата\'",1),"")');
  calc.getRange('G1').setFormula('=IFERROR(QUERY(Log!B:H,"select B, max(F) where B is not null group by B pivot D label B \'Дата\'",1),"")');
  calc.getRange('M1').setFormula('=IFERROR(QUERY(Log!B:H,"select B, count(G) where B is not null group by B pivot D label B \'Дата\'",1),"")');
  calc.getRange('B2:D1000').setNumberFormat('0%');

  // Дашборд
  var d = getSheet_('Dashboard');
  d.clear();
  d.getCharts().forEach(function (c) { d.removeChart(c); });
  d.getRange('A1').setValue('Штаб винахідника - дашборд').setFontSize(16).setFontWeight('bold');
  var kpi = [
    ['Задач усього', '=COUNTA(Log!A2:A)'],
    ['Точність усього', '=IFERROR(AVERAGE(Log!G2:G),"")'],
    ['Точність за 7 днів', '=IFERROR(AVERAGE(FILTER(Log!G2:G,Log!B2:B>=TODAY()-7)),"")'],
    ['Активних днів за 30', '=IFERROR(COUNTUNIQUE(FILTER(Log!B2:B,Log!B2:B>=TODAY()-30)),0)'],
    ['Хвилин на день (7 днів)', '=IFERROR(SUM(FILTER(Log!H2:H,Log!B2:B>=TODAY()-7))/60/COUNTUNIQUE(FILTER(Log!B2:B,Log!B2:B>=TODAY()-7)),"")']
  ];
  d.getRange(3, 1, kpi.length, 1).setValues(kpi.map(function (r) { return [r[0]]; }));
  d.getRange(3, 2, kpi.length, 1).setFormulas(kpi.map(function (r) { return [r[1]]; }));
  d.getRange('B4:B5').setNumberFormat('0%');
  d.getRange('B7').setNumberFormat('0.0');
  d.getRange('A3:A7').setFontWeight('bold');

  d.getRange('D3:E3').setValues([['Навичка', 'Поточний рівень']]).setFontWeight('bold');
  ['Математика', 'Інженерія', 'Критичне мислення'].forEach(function (s, i) {
    var r = 4 + i;
    d.getRange(r, 4).setValue(s);
    d.getRange(r, 5).setFormula('=IFERROR(INDEX(SORT(FILTER({Log!C2:C,Log!F2:F},Log!D2:D=D' + r + '),1,FALSE),1,2),"")');
  });

  d.getRange('A10').setValue('Слабкі місця за 30 днів (від 3 спроб, найнижча точність зверху)').setFontWeight('bold');
  d.getRange('A11').setFormula(
    '=IFERROR(QUERY(QUERY(Log!B:H,"select D, E, count(G), avg(G), avg(H) where B >= date \'"&TEXT(TODAY()-30,"yyyy-mm-dd")&"\' group by D, E label D \'Навичка\', E \'Тип задачі\', count(G) \'Спроб\', avg(G) \'Точність\', avg(H) \'Сек на задачу\'",1),"select * where Col3 >= 3 order by Col4 asc",1),"Даних ще мало")'
  );
  d.getRange('D12:D60').setNumberFormat('0%');
  d.getRange('E12:E60').setNumberFormat('0');
  d.setColumnWidth(1, 190); d.setColumnWidth(2, 210); d.setColumnWidth(4, 160);

  d.insertChart(d.newChart().setChartType(Charts.ChartType.LINE)
    .addRange(calc.getRange('A1:D400')).setNumHeaders(1)
    .setOption('title', 'Точність по днях').setOption('vAxis', { format: 'percent', viewWindow: { min: 0, max: 1 } })
    .setPosition(1, 8, 0, 0).setOption('width', 620).setOption('height', 280).build());
  d.insertChart(d.newChart().setChartType(Charts.ChartType.LINE)
    .addRange(calc.getRange('G1:J400')).setNumHeaders(1)
    .setOption('title', 'Рівень по днях (1-10)').setOption('vAxis', { viewWindow: { min: 0, max: 10 } })
    .setPosition(16, 8, 0, 0).setOption('width', 620).setOption('height', 280).build());
  d.insertChart(d.newChart().setChartType(Charts.ChartType.COLUMN)
    .addRange(calc.getRange('M1:P400')).setNumHeaders(1).setOption('isStacked', true)
    .setOption('title', 'Задач на день').setPosition(31, 8, 0, 0)
    .setOption('width', 620).setOption('height', 280).build());

  ss.setActiveSheet(d);
  calc.hideSheet();
}

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
