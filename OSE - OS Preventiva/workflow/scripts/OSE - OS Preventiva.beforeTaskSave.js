function beforeTaskSave(colleagueId,nextSequenceId,userList){
	
	var login = fluigAPI.getUserService().getCurrent().getLogin();
	var primeiraLetra = login.substring(0, 1).toUpperCase();
	var restoDaString = login.slice(1);
	var codusuario = primeiraLetra + restoDaString;
	//=========================================================================================================================================================
	var dataset = DatasetFactory.getDataset("ds_OSE_Valida_Acessos", 
	        null, 
	        [DatasetFactory.createConstraint("CODUSUARIO", codusuario, codusuario, ConstraintType.MUST)],
	        null);
	var temacesso = true
	for(var i = 0; i < dataset.rowsCount; i++) {
        if (dataset.getValue(i, "TEMACESSO") == 'FALSE'){temacesso = false};
    }
	
	if (getValue("WKNumState") == "12"){
		if (temacesso){criacaoOSPreventiva()} else {throw "\n\nVocê não tem todos os acessos para proseguir com o processo!\n\n"}
	}
	
	if (getValue("WKNumState") == "18" && getValue("WKNextState") == "13"){
		validacaoHorimetroCorreto();
		validacaoRMRSPendente();
		validacaoRMRSP();
		if (temacesso){finalizacaoOSPreventiva()} else {throw "\n\nVocê não tem todos os acessos para proseguir com o processo!\n\n"}
	}
	//=========================================================================================================================================================
	if ((getValue("WKNumState") == "0" || getValue("WKNumState") == "12") && hAPI.getCardValue("DATAINICIOOS") == ""){
		var dataFormatada = getDataAtual();
		hAPI.setCardValue("DATAINICIOOS", dataFormatada);
	}
	
	if (nextSequenceId == "13"){
		var dataFormatada = getDataAtual();
		hAPI.setCardValue("DATATERMINOOS", dataFormatada);
	}
	
}

function validacaoHorimetroCorreto(){
	
	var regex = /^(TDE|TCM|TTP|TPE|TPA|TRB|TEH|TPC|TRE|TMH|TPH|TDV|TTT|LCM|LCR|LDE|LDV|LEH|LMN|LMP|LOB|LPC|LPE|LPG|LRC|LRE|LTE).*/
		if ( regex.test(hAPI.getCardValue("OBJETODEMANUTENCAO")) ){


	try {
		
		var c1 = DatasetFactory.createConstraint("IDOBJOF", hAPI.getCardValue('OBJETODEMANUTENCAO'),
				hAPI.getCardValue('OBJETODEMANUTENCAO'), ConstraintType.MUST);

		var constraints = new Array(c1);
		var dataset = DatasetFactory.getDataset('ds_OSE_Objeto_de_Manutencao_Horimetro',null,constraints,null);
		
        //form.setValue('DATACOLETA', dataset.getValue(0, "DATACOLETA"));
        
        var horimetroAtual = +(hAPI.getCardValue('HORIMETROMEDIDOR'))
        var horimetroMaximo = +(dataset.getValue(0, "HORASMAXIMAS"))
        var horimetroAcumulado = +(dataset.getValue(0, "HORIMETRO"))
        
        log.error("horimetroAtual: "+horimetroAtual)
        log.error("horimetroMaximo: "+horimetroMaximo)
        log.error("horimetroAcumulado: "+horimetroAcumulado)
        if(horimetroAtual > horimetroMaximo){
        	throw "\n\n O Horimetro digitado é maior que o prazo desde a ultima medição! \n\n"; 
        }
        if(horimetroAtual < horimetroAcumulado){
        	throw "\n\n O Horimetro digitado é menor que o Horimetro acumulado! \n\n"; 
        }

	}catch (e){
		log.error("Erro ao validar Horimetro, favor tente novamente online\n\n"+e);
		throw e;
	}
	
  }
}

function criacaoOSPreventiva(){
		
	var nomeDataserver = "MOVMOVIMENTOTBCDATA"
	log.info("nomeDataserver: "+nomeDataserver)
	
	var user = DatasetFactory.getDataset("ds_connector", null, null, null);
	log.info("user: "+user)
	
	var usuario = user.getValue(0, "INTEGRADOR")
	log.info("usuario: "+usuario)
	var senha = user.getValue(0, "SENHA")
	//log.info("senha: "+senha)
	var email = user.getValue(0, "EMAIL")
	log.info("email: "+email)
	
	var login = fluigAPI.getUserService().getCurrent().getLogin();
	var primeiraLetra = login.substring(0, 1).toUpperCase();
	log.info("primeiraLetra: "+primeiraLetra)
	var restoDaString = login.slice(1);
	log.info("restoDaString: "+restoDaString)
	var codusuario = primeiraLetra + restoDaString;
	
	var contexto = "codcoligada=1;codusuario="+codusuario+";codsistema=N";
		log.info("contexto: "+contexto)
		
	var authService = getWebService(usuario, senha)
	log.info("authService: "+authService)
	
 
	//var CHAPA = hAPI.getCardValue("CHAPACOLABORADOR")
	
	//var NUMPROCES = "+hAPI.getCardValue("NUMPROCES")+"

    //xml que envia as informaçoes para o RM    
	var xml = ""+
	"<MovMovimento>"+
	
	"<TMOV>"+
		"<CODCOLIGADA>1</CODCOLIGADA>"+
		"<IDMOV>-1</IDMOV>"+
		"<CODFILIAL>"+hAPI.getCardValue("CODFILIAL")+"</CODFILIAL>"+
		"<CODTMV>1.1.22</CODTMV>"+
		"<CODLOC>"+hAPI.getCardValue("CODLOCALESTOQUE").trim()+"</CODLOC>"+
		"<CODCCUSTO>"+hAPI.getCardValue("CODCENTRODECUSTO")+"</CODCCUSTO>"+
		"<CODDEPARTAMENTO>"+hAPI.getCardValue("CODDEPARTAMENTO")+"</CODDEPARTAMENTO>"+
		"<CODTB1FAT>02</CODTB1FAT>"+
		"<CODTB3FAT>05</CODTB3FAT>"+
		"<HISTORICOLONGO> </HISTORICOLONGO>"+
		"<CODAGENDAMENTO>"+hAPI.getCardValue("IDPLANO")+"</CODAGENDAMENTO>"+
		"<IDOBJOF>"+hAPI.getCardValue("OBJETODEMANUTENCAO")+"</IDOBJOF>"+
		"<CAMPOLIVRE3>"+hAPI.getCardValue("HORIMETROVENCIMENTO")+"</CAMPOLIVRE3>";
		
		xml = xml+"</TMOV>";

	var NSEQITMMOV = 1;
	var indexes = hAPI.getChildrenIndexes("TABELA_PLANOMANUTENCAO");

	for (var i = 1; i <= indexes.length; ++i) {
		xml = xml+"<TITMMOV>"+
			"<CODCOLIGADA>1</CODCOLIGADA>"+
			"<IDMOV>-1</IDMOV>"+
			"<NSEQITMMOV>"+NSEQITMMOV+"</NSEQITMMOV>"+
			"<CODCCUSTO>"+hAPI.getCardValue("CODCENTRODECUSTO")+"</CODCCUSTO>"+
			"<CODDEPARTAMENTO>"+hAPI.getCardValue("CODDEPARTAMENTO")+"</CODDEPARTAMENTO>"+
			"<IDPRD>"+hAPI.getCardValue("PLANOMANIDPRD___"+i)+"</IDPRD>"+
			"<QUANTIDADE>"+hAPI.getCardValue("PLANOMANQUANTIDADE___"+i).replace(".",",")+"</QUANTIDADE>"+
			"<PRECOUNITARIO>"+hAPI.getCardValue("PLANOMANPRECOUNITARIO___"+i).replace(".",",")+"</PRECOUNITARIO>"+
			"<CODTB2FAT>12</CODTB2FAT>"+
			"<CODTB3FAT>05</CODTB3FAT>"+
			"<IDOBJOFICINA>"+hAPI.getCardValue("OBJETODEMANUTENCAO")+"</IDOBJOFICINA>"+
			"<IDTIPOOBJ>"+hAPI.getCardValue("CODTIPOOBJ")+"</IDTIPOOBJ>"+
	 	"</TITMMOV>";
		NSEQITMMOV++;
	}
 	
	xml = xml+"</MovMovimento>";
			
	log.error("xml: ")
	log.error(xml)
			
	var result = new String( authService.saveRecord(nomeDataserver, xml, contexto) );
	//String DataServerName, String XML, String UserName, String UserPassword, String contexto, String emailUsuarioContexto
	
	if (result.split(";")[0] == "1"){
		hAPI.setCardValue("OSIDMOV", result.split(";")[1])
		log.error("result: "+result);
		log.info("teste")
		log.info(result)
		//Execução a seguir altera a OS criada do status "normal" para o "Aguardando Análise"
		var xml = "<MovMovimento>"+
					  "<TMOV>"+
					    "<CODCOLIGADA>1</CODCOLIGADA>"+
					    "<IDMOV>"+result.split(";")[1]+"</IDMOV>"+
					    "<STATUS>O</STATUS>"+
					  "</TMOV>"+
					  "<TMOVCOMPL>"+
						"<CODCOLIGADA>1</CODCOLIGADA>"+
						"<IDMOV>"+result.split(";")[1]+"</IDMOV>"+
						"<NFLUIG>"+getValue("WKNumProces").toString()+"</NFLUIG>"+
					  "</TMOVCOMPL>"+
					"</MovMovimento>";
					    
		var result = new String( authService.saveRecord(nomeDataserver, xml, contexto) );
		log.error("result Status: "+result);
		log.info("----XML---")
		log.info(xml)
		if (result.split(";")[0] != "1"){
			log.info("esse e o teste das OS preventivas")
			log.info(result)
			throw "ERRO AO PREENCHER STATUS CORRETO DA OS\n\n"+result.split("=")[0]+"\n\n"
		}
		
		try{
			var dataset = DatasetFactory.getDataset("ds_OSE_Numero_OS", 
				        null, 
				        [DatasetFactory.createConstraint("IDMOV", result.split(";")[1], result.split(";")[1], ConstraintType.MUST)],
				        null);
			hAPI.setCardValue("OSNUMEROMOV",  dataset.getValue(0, "NUMEROMOV"))
		} catch (e){
			throw "ERRO AO CONSULTAR NUMERO DA OS:\n\n"+result.split("=")[0]+"\n\n"
		}
	} else {
		throw "ERRO AO CRIAR A OS:\n\n"+result.split("=")[0]+"\n\n"
	}
}

function finalizacaoOSPreventiva(){
	
	var nomeDataserver = "MOVMOVIMENTOTBCDATA"
	log.info("nomeDataserver: "+nomeDataserver)
	
	var user = DatasetFactory.getDataset("ds_connector", null, null, null);
	log.info("user: "+user)
	
	var usuario = user.getValue(0, "INTEGRADOR")
	log.info("usuario: "+usuario)
	var senha = user.getValue(0, "SENHA")
	//log.info("senha: "+senha)
	var email = user.getValue(0, "EMAIL")
	log.info("email: "+email)

	var login = fluigAPI.getUserService().getCurrent().getLogin();
	var primeiraLetra = login.substring(0, 1).toUpperCase();
	log.info("primeiraLetra: "+primeiraLetra)
	var restoDaString = login.slice(1);
	log.info("restoDaString: "+restoDaString)
	var codusuario = primeiraLetra + restoDaString;
	
	var contexto = "codcoligada=1;codusuario="+codusuario+";codsistema=N"
		log.info("contexto: "+contexto)
		
	var authService = getWebService(usuario, senha)
	log.info("authService: "+authService)
	
	// Obtém a data atual
	var dataAtual = new Date();
	
	// Extrai os componentes da data
	var ano = dataAtual.getFullYear();
	var mes = (dataAtual.getMonth() + 1) < 10 ? "0"+(dataAtual.getMonth() + 1) : (dataAtual.getMonth() + 1); // Os meses são indexados a partir de 0
	var dia = (dataAtual.getDate()) < 10 ? "0"+(dataAtual.getDate()) : (dataAtual.getDate());
	var horas = (dataAtual.getHours()) < 10 ? "0"+(dataAtual.getHours()) : (dataAtual.getHours());
	var minutos = (dataAtual.getMinutes()) < 10 ? "0"+(dataAtual.getMinutes()) : (dataAtual.getMinutes());
	var segundos = (dataAtual.getSeconds()) < 10 ? "0"+(dataAtual.getSeconds()) : (dataAtual.getSeconds());
	
	// Formata a data
	var dataFormatada = ano+"-"+mes+"-"+dia+"T"+horas+":"+minutos+":"+segundos
	
	var historicoLongo = String(hAPI.getCardValue("SERVICOASEREXECUTADO")).replace(/\r?\n/g, '\n') + '\n' + String(hAPI.getCardValue("SOLUCAO")).replace(/\r?\n/g, '\n');
	
	var xml = "<MovMovimento>"+
				  "<TMOV>"+
				    "<CODCOLIGADA>1</CODCOLIGADA>"+
				    "<IDMOV>"+hAPI.getCardValue("OSIDMOV")+"</IDMOV>"+
				    "<STATUS>Z</STATUS>"+
				    "<DATAEXTRA1>"+dataFormatada+"</DATAEXTRA1>"+
				    "<DATAEXTRA2>"+dataFormatada+"</DATAEXTRA2>"+
					"<HISTORICOLONGO>"+historicoLongo+"</HISTORICOLONGO>"+
				  "</TMOV>"+
				  "<TMOVCOMPL>"+
					"<CODCOLIGADA>1</CODCOLIGADA>"+
					"<IDMOV>"+hAPI.getCardValue("OSIDMOV")+"</IDMOV>"+
					"<ATUALIZACAO2>"+dataFormatada+"</ATUALIZACAO2>"+
				  "</TMOVCOMPL>"+
				"</MovMovimento>";

	log.error("xml: ")
	log.error(xml)
				    
	var result = new String( authService.saveRecord(nomeDataserver, xml, contexto) );
	log.error("result Status: "+result);
	if (result != ("1;"+hAPI.getCardValue("OSIDMOV"))){
		throw "ERRO AO FINALIZAR OS\n\n"+result.split("=")[0]+"\n\n"
	}

	//=================================================================================
	
	
	var regex = /^(TDE|TCM|TTP|TPE|TPA|TRB|TEH|TPC|TRE|TMH|TPH|TDV|TTT|LCM|LCR|LDE|LDV|LEH|LMN|LMP|LOB|LPC|LPE|LPG|LRC|LRE|LTE).*/
		if ( regex.test(hAPI.getCardValue("OBJETODEMANUTENCAO")) ){


	var nomeDataserver = "MntHistIndicadorData";
	
	// Obtém a data atual
	var dataAtual = new Date();
	
	// Extrai os componentes da data
	var ano = dataAtual.getFullYear();
	var mes = (dataAtual.getMonth() + 1) < 10 ? "0"+(dataAtual.getMonth() + 1) : (dataAtual.getMonth() + 1); // Os meses são indexados a partir de 0
	var dia = (dataAtual.getDate()) < 10 ? "0"+(dataAtual.getDate()) : (dataAtual.getDate());
	var horas = (dataAtual.getHours()) < 10 ? "0"+(dataAtual.getHours()) : (dataAtual.getHours());
	var minutos = (dataAtual.getMinutes()) < 10 ? "0"+(dataAtual.getMinutes()) : (dataAtual.getMinutes());
	var segundos = (dataAtual.getSeconds()) < 10 ? "0"+(dataAtual.getSeconds()) : (dataAtual.getSeconds());
	
	// Formata a data
	var dataFormatada = ano+"-"+mes+"-"+dia+"T"+horas+":"+minutos+":"+segundos
            
	var dataColeta = hAPI.getCardValue("DATACOLETA").split(" ")[0]
	dataColeta = new Date(dataColeta.split("-")[0], dataColeta.split("-")[1]-1, dataColeta.split("-")[2]);
	log.error("DataColeta: " + dataColeta);
	log.error("DataAtual: " + new Date(ano, mes-1, dia));
	

	try{
		var c1_2 = DatasetFactory.createConstraint("IDOBJOF", hAPI.getCardValue("OBJETODEMANUTENCAO"), hAPI.getCardValue("OBJETODEMANUTENCAO"), ConstraintType.MUST);
		var constraints_2 = new Array(c1_2);
		var dataset_2 = DatasetFactory.getDataset("ds_OSE_HistoricoIndicadorDeUso", null, constraints_2, null);
		var horimetroAtual = dataset_2.getValue(0, "VALORMEDIDOR1");
		var horimetroAcumulado = dataset_2.getValue(0, "VALORACUMULADO1");
		var combustivelAtual = dataset_2.getValue(0, "VALORMEDIDOR5") == "null" ? 0 : dataset_2.getValue(0, "VALORMEDIDOR5");
		var combustivelAcumulado = dataset_2.getValue(0, "VALORACUMULADO5") == "null" ? 0 : dataset_2.getValue(0, "VALORACUMULADO5");
		var dataLancamento = dataset_2.getValue(0, "DATALANCAMENTO").split(" ")[0];
	} catch (e) {
		log.error(e);
	}
	
	if ( parseFloat(horimetroAtual) < parseFloat(hAPI.getCardValue("HORIMETROMEDIDOR")) ){
		horimetroAcumulado = parseFloat(horimetroAcumulado) + (parseFloat(hAPI.getCardValue("HORIMETROMEDIDOR")) - parseFloat(horimetroAtual));
	}
	if ( parseFloat(combustivelAtual) < parseFloat(hAPI.getCardValue("VALORMEDIDOR5")) ){
		combustivelAcumulado = parseFloat(combustivelAcumulado) + (parseFloat(hAPI.getCardValue("VALORMEDIDOR5")) - parseFloat(combustivelAtual));
	}
	
	if ( ( new Date(ano, mes-1, dia).toISOString().split('T')[0] > dataLancamento ) ||
			( dataLancamento == dataColeta.toISOString().split('T')[0] &&
					String(hAPI.getCardValue("HORIMETROMEDIDOR")).replace(".", ",") != horimetroAtual.replace(".", ",") ) ){
	    //xml que envia as informaçoes para o RM    
		var xml = "<NewDataSet>"+
					"<OFHistIndicador>"+
				    "<CODCOLIGADA>1</CODCOLIGADA>"+
					  "<IDOBJOF>" +hAPI.getCardValue("OBJETODEMANUTENCAO")+ "</IDOBJOF>"+
					  "<IDHISTINDICADOR>-1</IDHISTINDICADOR>"+
					  "<DATACOLETA>" +dataFormatada+ "</DATACOLETA>"+
					  "<CODUSUARIO>" +codusuario+ "</CODUSUARIO>"+
					  "<VALORMEDIDOR1>" +hAPI.getCardValue("HORIMETROMEDIDOR").replace(".", ",")+ "</VALORMEDIDOR1>"+
					  "<VALORACUMULADO1>" +String(horimetroAcumulado).replace(".", ",")+ "</VALORACUMULADO1>";
		
					if (hAPI.getCardValue("USAINDICADORUSO5") == "1"){
						xml = xml+"<VALORMEDIDOR5>" +String(hAPI.getCardValue("VALORMEDIDOR5")).replace(".", ",")+ "</VALORMEDIDOR5>"+
						"<VALORACUMULADO5>" +String(combustivelAcumulado).replace(".", ",")+ "</VALORACUMULADO5>";
					}
					xml = xml+"</OFHistIndicador>"+
				  "</NewDataSet>";
					
		var result = new String( authService.saveRecord(nomeDataserver, xml, contexto) );
		log.error("result: "+result);
		
		if (result.split(";")[1] != hAPI.getCardValue("OBJETODEMANUTENCAO")){
			throw "ERRO AO LANÇAR HORIMETRO DA MAQUINA\n\n"+result.split("=")[0]+"\n\n"
		}
	} else {
		log.error("Não entrou no IF");
		log.error("=======================================================");
		log.error("new Date: "+new Date(ano, mes-1, dia).toISOString().split('T')[0]);
		log.error("dataLancamento: "+dataLancamento);
		log.error("=======================================================");
		log.error("dataLancamento: "+dataLancamento);
		log.error("datacoleta: "+dataColeta.toISOString().split('T')[0]);
		//log.error("VALORMEDIDOR1: "+String(VALORMEDIDOR1).replace(".", ","));
		log.error("horimetroAtual: "+horimetroAtual.replace(".", ","));
		log.error("=======================================================");
	}
	
	
	}
	updateIdhistIdocador()
}

function getWebService(usuario, senha){
	
	var nomeServico = "wsDataServer"
		log.info("nomeServico: "+nomeServico)
		
	var caminhoServico = "com.totvs.WsDataServer"
		log.info("caminhoServico: "+caminhoServico)
		
	var dataServerService = ServiceManager.getServiceInstance(nomeServico);
	log.info("dataServerService: "+dataServerService)
	
	if (dataServerService == null){
		throw "Erro ao encontrar serviço!";
	}
	
	var locator = dataServerService.instantiate(caminhoServico);
	log.info("locator: "+locator)

	if (locator == null){
		throw "Erro ao instanciar serviço!";
	}
	
	var service = locator.getRMIwsDataServer();
	log.info("service: "+service)

	if (service == null){
		throw "Erro instancia incorreta ou com problemas!";
	}
	
	var serviceHelper = dataServerService.getBean();
	log.info("serviceHelper: "+serviceHelper)

	if (serviceHelper == null){
		throw "Erro no serviço de autenticação!";
	}
	
	var authService = serviceHelper.getBasicAuthenticatedClient(service, "com.totvs.IwsDataServer", usuario, senha)
	log.info("authService: "+authService)

	if (authService == null){
		throw "Erro ao autenticar dataserver!";
	}
	
	return authService;

}

function validacaoRMRSPendente(){

	try {
		
		var c1 = DatasetFactory.createConstraint("IDMOVOS", hAPI.getCardValue('OSIDMOV'),
			hAPI.getCardValue('OSIDMOV'), ConstraintType.MUST);

		var constraints = new Array(c1);
		var dataset = DatasetFactory.getDataset('ds_OSE_RMRS_Pendente',null,constraints,null);
		var row = dataset.values[0];

        if(dataset.rowsCount > 0){
        	throw "\n\nVocê não pode finalizar uma OS com RM Pendente!\n\n"
        }
        
	}catch (e){
		log.error(e)
	}	
}

function validacaoRMRSP(){


		var c1 = DatasetFactory.createConstraint("IDMOVOS",hAPI.getCardValue('OSIDMOV'), hAPI.getCardValue('OSIDMOV'), ConstraintType.MUST);

		var constraints = new Array(c1);
		var dataset = DatasetFactory.getDataset('ds_RMRS_Pend_Prev',null,constraints,null);
		var row = dataset.getValue(0, "STATUS")
		
		
		if (row== "G"){
			throw "A RM com status PARCIALMENTE RECEBIDO, A OS não podem ser Fechadas !"
		}
		if (row == "A"){
			throw "A RM com status PENDENTE, A OS  não podem ser Fechadas !"
		}
		if (row == "B"){
			throw "A RM com status BLOQUEADO, A OS  não podem ser Fechadas !"
		}
		if (row == "U"){
			throw "A RM com status EM FATURAMENTO, A OS não podem ser Fechadas !"
		}
		
		
		
}

function updateIdhistIdocador(){
	log.info("Entrou no update" +hAPI.getCardValue("OSIDMOV"))
	try {
		
		var c1 = DatasetFactory.createConstraint("IDMOVOS", hAPI.getCardValue("OSIDMOV") ,hAPI.getCardValue("OSIDMOV"), ConstraintType.MUST);
		
		var constraints = new Array(c1);
		var dataset = DatasetFactory.getDataset('ds_update_IDHISTINDICADOR',null,constraints,null);
		
	}catch (e){
		log.error(e)
	}
	log.info("executou o update" +hAPI.getCardValue("OSIDMOV"))
}