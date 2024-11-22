function validateForm(form){
	var numState = getValue("WKNumState");
	var nextState = getValue("WKNextState");

	if (numState == "0" || numState == "12"){
		if (form.getValue("OBJETODEMANUTENCAO") == ""){
			throw "É obrigatorio preencher o Objeto de Manutenção!"
		}
		if (form.getValue("CHAPARESP") == "NÃO PREENCHIDO NO TOTVS"){
			throw "Favor incluir o responsavel da Máquina " +form.getValue("OBJETODEMANUTENCAO")+ "No Obejto de Manutenção"
		}
		if (form.getValue("LOCALESTOQUE") == ""){
			throw "É obrigatorio preencher o Local de Estoque!"
		}
		if (form.getValue("PLANODEMANUTENCAO") == ""){
			throw "É obrigatorio selecionar o Plano de Manutenção!"
		}
		if(nextState == "39"){
			var indexes = form.getChildrenIndexes("TABELA_PLANOMANUTENCAO");
			for (var i = 0; i < indexes.length; i++) {
				if (form.getValue("PLANOMANATIVIDADE___" + indexes[i]).substring(0, 2) != "1."){
					throw "Este plano de manutenção possúi peças, por isso, você não pode enviar direto para a Execução do Serviço!"
				}
		    }
		}
	}
	
	if (numState == "16"){
		if (form.getValue("PREVISAOEXECUCAOSERVICO") == ""){
			throw "É obrigatorio preencher a Previsão Execução Serviço Programado!"
		}
		if (form.getValue("FOLLOWUP") == ""){
			throw "É obrigatorio preencher o Follow up!"
		}
	}
	
	if (numState == "18" && nextState == "13"){
		
		
		
		
		
		

		var c1 = DatasetFactory.createConstraint("IDOBJOF", form.getValue["OBJETODEMANUTENCAO"], form.getValue["OBJETODEMANUTENCAO"], ConstraintType.MUST);
		var constraints = new Array(c1);
		var dataset = DatasetFactory.getDataset("ds_OSE_Objeto_de_Manutencao", null, constraints, null);
		//var row = dataset.values[0];
		form.setValue("HORIMETROACUMULADO", dataset.getValue(0, "HOTRIMETRO"))
		form.setValue("HORIMETROMAXIMO",dataset.getValue(0, "HORASMAXIMAS"))
		form.setValue("USAINDICADORUSO5", dataset.getValue(0, "USAINDICADORUSO5"))
		if (dataset.getValue(0, "USAINDICADORUSO5") == "1"){
			 form.setEnabled("VALORMEDIDOR5",true);
		} else {
			 form.setEnabled("VALORMEDIDOR5",false);
			form.setValue("VALORMEDIDOR5", "")
		}
		
		
		
		var c1 = DatasetFactory.createConstraint("IDMOVOS",form.getValue('OSIDMOV'), form.getValue('OSIDMOV'), ConstraintType.MUST);

		var constraints = new Array(c1);
		var dataset = DatasetFactory.getDataset('ds_RMRS_Pend_Prev',null,constraints,null);
		var row = dataset.getValue(0, "STATUS")
		//var tetse = row["STATUS"]
	
		
		if (row == "G"){
			throw "A RM com status PARCIALMENTE RECEBIDO, não podem ser Fechadas !"
		}
		if (row == "A"){
			throw "A RM com status PENDENTE, não podem ser Fechadas !"
		}
		if (row == "B"){
			throw "A RM com status BLOQUEADO, não podem ser Fechadas !"
		}
		if (row == "U"){
			throw "A RM com status EM FATURAMENTO, não podem ser Fechadas !"
		}
		
		if (form.getValue("HORIMETROMEDIDOR") == ""){
			throw "É obrigatorio preencher o Horímetro atual do equipamento!"
		}
		
	    if (form.getValue("VALORMEDIDOR5") == "" && form.getValue("USAINDICADORUSO5") == "1") {
	    	throw "É obrigatório preencher o campo Diesel/Gasolina/Alcool!"
	    }
		
		var maodeobra = form.getChildrenIndexes("TABELA_MAODEOBRA");
		if (maodeobra.length < 1){
			throw "É obrigatório ter pelo menos um registro de Mão de Obra!";
		} else {
		    for (var i = 0; i < maodeobra.length; i++) {
		        if (form.getValue("MAODEOBRANOME___" + maodeobra[i]) == ""){ throw "Favor preencher o campo Nome da tabela de mão de obra!" }
		        if (form.getValue("MAODEOBRAHORAINICIO___" + maodeobra[i]) == ""){ throw "Favor iniciar a OS!" }
		        if (form.getValue("MAODEOBRAHORASTOTAIS___" + maodeobra[i]) == ""){ throw "Favor pausar a OS!" }
		    }
		}
	    
		var indexes = form.getChildrenIndexes("TABELA_PLANOMANUTENCAO");
		for (var i = 0; i < indexes.length; i++) {
			if (form.getValue("PLANOMANSTATUS___" + indexes[i]) != "on"){
				if (form.getValue("PLANOMANJUSTIFICA___" + indexes[i]) == ""){
					throw "Favor justificar a NÃO EXECUÇÃO do item "+ form.getValue("PLANOMANATIVIDADE___"+indexes[i])
				}
			}
	    }
	}

}