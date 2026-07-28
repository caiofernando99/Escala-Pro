/**
 * Helper module containing the canonical Google Apps Script Web App code for EscalaPro
 */

export function getAppsScriptCode(customSpreadsheetUrl?: string): string {
  const defaultUrlComment = customSpreadsheetUrl && customSpreadsheetUrl.startsWith('http')
    ? `"${customSpreadsheetUrl.replace(/"/g, '')}"`
    : `""`;

  return `/**
 * ====================================================================
 * ESCALAPRO - GOOGLE APPS SCRIPT INTEGRATION (v3.2 UNIVERSAL)
 * Funciona com scripts vinculados ou autônomos (script.google.com)
 * ====================================================================
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ status: "error", message: "Conteúdo do POST vazio" });
    }

    var contentsStr = e.postData.contents;
    var payload = JSON.parse(contentsStr);

    // 1. Salva o estado bruto no banco interno do Apps Script para leitura em tempo real via GET (doGet)
    PropertiesService.getScriptProperties().setProperty("APP_STATE", contentsStr);
    PropertiesService.getScriptProperties().setProperty("LAST_UPDATED_AT", new Date().getTime().toString());

    // 2. Localiza a planilha (vinculada ou por URL/ID)
    var ss = getTargetSpreadsheet(payload);
    if (!ss) {
      return responseJSON({
        status: "warning",
        message: "Estado salvo em nuvem, mas a planilha não pôde ser aberta. Verifique se o link da planilha está correto nas configurações do EscalaPro."
      });
    }

    var timestamp = new Date().toLocaleString("pt-BR");

    // 3. Salva estado na aba oculta __DB_STATE__
    var sheetDb = getOrCreateSheet(ss, "__DB_STATE__");
    sheetDb.getRange("A1").setValue(contentsStr);
    try { sheetDb.hideSheet(); } catch (err) {}

    // 4. Aba 1: "Cadastro da Equipe" (CRUD Mestre da Equipe)
    var masterList = payload.collaboratorsMaster || payload.data;
    if (masterList && Array.isArray(masterList)) {
      var sheetEquipe = getOrCreateSheet(ss, "Cadastro da Equipe");
      sheetEquipe.clear();

      var headersEquipe = [
        ["RE (Matrícula)", "Nome Completo", "LDAP / Login", "Setor / Operação", "Gestor Responsável", "Turno", "Team Leader / Time", "Escala", "Cargo", "Categoria", "Skills & Proficiências", "Status no Sistema", "Última Atualização"]
      ];
      sheetEquipe.getRange(1, 1, 1, headersEquipe[0].length)
        .setValues(headersEquipe)
        .setFontWeight("bold")
        .setBackground("#1e293b")
        .setFontColor("#ffffff");

      var rowsEquipe = masterList.map(function(col) {
        return [
          col.registration || "",
          col.name || "",
          col.login || "",
          col.sector || payload.sector || "",
          col.manager || payload.manager || "",
          col.shift || payload.shift || "",
          col.teamLeader || "",
          col.scale || "",
          col.role || "",
          col.category || "",
          col.skills || "Nenhuma",
          col.status || "Ativo",
          timestamp
        ];
      });

      if (rowsEquipe.length > 0) {
        sheetEquipe.getRange(2, 1, rowsEquipe.length, headersEquipe[0].length).setValues(rowsEquipe);
      }
      try { sheetEquipe.autoResizeColumns(1, headersEquipe[0].length); } catch (e) {}
    }

    // 5. Aba 2: "Escala Diária" (Dimensionamento e Refeição do Dia)
    if (payload.data && Array.isArray(payload.data)) {
      var sheetEscala = getOrCreateSheet(ss, "Escala Diária");
      sheetEscala.clear();

      var headersEscala = [
        ["Data da Escala", "RE (Matrícula)", "Nome do Colaborador", "LDAP / Login", "Setor", "Gestor", "Turno", "Team Leader", "Escala", "Cargo", "Categoria", "Status no Dia", "Tarefa Alocada", "Horário de Intervalo", "Última Atualização"]
      ];
      sheetEscala.getRange(1, 1, 1, headersEscala[0].length)
        .setValues(headersEscala)
        .setFontWeight("bold")
        .setBackground("#0284c7")
        .setFontColor("#ffffff");

      var rowsEscala = payload.data.map(function(item) {
        return [
          item.date || payload.date || "",
          item.registration || "",
          item.name || "",
          item.login || "",
          item.sector || payload.sector || "",
          item.manager || payload.manager || "",
          item.shift || payload.shift || "",
          item.teamLeader || "",
          item.scale || "",
          item.role || "",
          item.category || "",
          item.status || "",
          item.task || "",
          item.interval || "",
          timestamp
        ];
      });

      if (rowsEscala.length > 0) {
        sheetEscala.getRange(2, 1, rowsEscala.length, headersEscala[0].length).setValues(rowsEscala);
      }
      try { sheetEscala.autoResizeColumns(1, headersEscala[0].length); } catch (e) {}
    }

    // 6. Aba 3: "Relatórios & Ocorrências"
    if (payload.reports) {
      var rep = payload.reports;
      var sheetRep = getOrCreateSheet(ss, "Relatórios & Ocorrências");

      if (sheetRep.getLastRow() === 0) {
        var repHeaders = [["Data", "Equipe / Setor", "Total Equipe", "Presentes", "Ausentes", "Férias", "Licença/Treinamento", "Folgas", "Taxa Absenteísmo %", "Observações", "Gerado Em"]];
        sheetRep.getRange(1, 1, 1, repHeaders[0].length)
          .setValues(repHeaders)
          .setFontWeight("bold")
          .setBackground("#0f172a")
          .setFontColor("#ffffff");
      }

      var repRow = [
        rep.date || "",
        (rep.teamName || "") + " - " + (rep.sector || ""),
        rep.totalCollaborators || 0,
        rep.presentCount || 0,
        rep.absentCount || 0,
        rep.vacationCount || 0,
        rep.leaveTrainingCount || 0,
        rep.offCount || 0,
        rep.absenteeismRate || "0%",
        rep.generalNotes || "",
        rep.generatedAt || timestamp
      ];
      sheetRep.appendRow(repRow);
    }

    // 7. Aba 4: "Configurações do Sistema"
    if (payload.settings) {
      var sheetConfig = getOrCreateSheet(ss, "Configurações do Sistema");
      sheetConfig.clear();

      sheetConfig.appendRow(["CONFIGURAÇÕES E PARÂMETROS - ESCALAPRO"]);
      sheetConfig.getRange("A1").setFontWeight("bold").setFontSize(13);

      sheetConfig.appendRow(["Parâmetro", "Valor Configurado"]);
      sheetConfig.getRange(2, 1, 1, 2).setFontWeight("bold").setBackground("#f3f4f6");

      sheetConfig.appendRow(["Nome da Equipe", payload.settings.teamName || ""]);
      sheetConfig.appendRow(["Setor / Operação", payload.settings.sector || ""]);
      sheetConfig.appendRow(["Gestor Responsável", payload.settings.manager || ""]);
      sheetConfig.appendRow(["Turno Geral", payload.settings.teamShift || ""]);
      sheetConfig.appendRow(["Líder de Equipe Padrão", payload.settings.defaultTeamLeader || ""]);
      sheetConfig.appendRow(["Auto-Sync em Tempo Real", payload.settings.autoSyncEnabled || "Sim"]);
      sheetConfig.appendRow(["Total de Colaboradores", payload.settings.totalCollaborators || 0]);
      sheetConfig.appendRow(["Última Sincronização", timestamp]);
    }

    return responseJSON({
      status: "success",
      message: "Planilha e estado atualizados com sucesso!",
      timestamp: timestamp
    });

  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  try {
    var rawState = PropertiesService.getScriptProperties().getProperty("APP_STATE");
    if (!rawState) {
      var ss = getTargetSpreadsheet({});
      if (ss) {
        var sheetDb = ss.getSheetByName("__DB_STATE__");
        if (sheetDb && sheetDb.getLastRow() >= 1) {
          rawState = sheetDb.getRange("A1").getValue();
        }
      }
    }

    if (rawState) {
      return ContentService.createTextOutput(rawState)
        .setMimeType(ContentService.MimeType.JSON);
    }

    return responseJSON({
      status: "empty",
      service: "EscalaPro Google Apps Script Webhook v3.2",
      message: "Webhook ativo e pronto para sincronizar!",
      timestamp: new Date().toLocaleString("pt-BR")
    });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function getTargetSpreadsheet(payload) {
  var ss = null;

  // 1. Tenta abrir a planilha ativa (script vinculado à planilha)
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}

  // 2. Tenta abrir pela URL informada no payload
  if (!ss && payload && payload.spreadsheetUrl) {
    try {
      ss = SpreadsheetApp.openByUrl(payload.spreadsheetUrl);
    } catch (e) {}
  }

  // 3. Tenta abrir pelo ID da planilha
  if (!ss && payload && payload.spreadsheetId) {
    try {
      ss = SpreadsheetApp.openById(payload.spreadsheetId);
    } catch (e) {}
  }

  // 4. Fallback para URL embutida
  var embeddedUrl = ${defaultUrlComment};
  if (!ss && embeddedUrl) {
    try {
      ss = SpreadsheetApp.openByUrl(embeddedUrl);
    } catch (e) {}
  }

  return ss;
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}
