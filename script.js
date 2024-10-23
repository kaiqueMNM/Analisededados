// Adiciona um listener de evento ao botão com ID 'processFile' para executar a função ao clicar
document.getElementById('processFile').addEventListener('click', function () {
  // Obtém o primeiro arquivo selecionado no input com ID 'excelFile'
  const file = document.getElementById('excelFile').files[0];
  // Obtém a div onde será exibida a informação do arquivo
  const fileInfoDiv = document.getElementById('fileInfo');
  // Obtém o elemento do spinner de carregamento
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Verifica se nenhum arquivo foi selecionado
  if (!file) {
    fileInfoDiv.innerHTML = '<strong>Por favor, selecione um arquivo.</strong>'; // Exibe mensagem de erro
    return; // Sai da função se não houver arquivo
  }

  // Verifica se o arquivo não é do tipo Excel ou CSV
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
    fileInfoDiv.innerHTML = '<strong>Por favor, selecione um arquivo Excel ou CSV válido (.xlsx, .xls, .csv).</strong>'; // Mensagem de erro
    return; // Sai da função se o tipo do arquivo não for válido
  }

  // Exibe o nome do arquivo selecionado
  fileInfoDiv.innerHTML = `Arquivo selecionado: <strong>${file.name}</strong>`;
  loadingSpinner.style.display = 'block'; // Exibe o spinner de carregamento

  // Cria um novo objeto FileReader para ler o arquivo
  const reader = new FileReader();
  reader.onload = function (e) { // Função a ser chamada quando o arquivo é lido
    const data = e.target.result; // Obtém os dados lidos do arquivo

    let excelData; // Declara uma variável para armazenar os dados do Excel
    // Verifica se o arquivo é um CSV
    if (file.name.endsWith('.csv')) {
      const workbook = XLSX.read(data, { type: 'string' }); // Lê o CSV como string
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; // Obtém a primeira planilha
      excelData = XLSX.utils.sheet_to_json(firstSheet); // Converte a planilha para JSON
    } else {
      const arrayBuffer = new Uint8Array(e.target.result); // Cria um ArrayBuffer a partir dos dados lidos
      const workbook = XLSX.read(arrayBuffer, { type: 'array' }); // Lê o arquivo como um Array
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; // Obtém a primeira planilha
      excelData = XLSX.utils.sheet_to_json(firstSheet); // Converte a planilha para JSON
    }

    loadingSpinner.style.display = 'none'; // Oculta o spinner de carregamento
    processExcelData(excelData); // Chama a função para processar os dados do Excel
  };

  // Lê o arquivo como texto se for um CSV, ou como ArrayBuffer caso contrário
  if (file.name.endsWith('.csv')) {
    reader.readAsText(file); // Lê o arquivo como texto
  } else {
    reader.readAsArrayBuffer(file); // Lê o arquivo como ArrayBuffer
  }
});

// Função para processar os dados do Excel
function processExcelData(excelData) {
  const columns = Object.keys(excelData[0]); // Obtém os nomes das colunas do primeiro registro
  const analysisData = {}; // Inicializa um objeto para armazenar os dados de análise

  // Itera sobre cada coluna
  columns.forEach((column) => {
    analysisData[column] = {}; // Cria um objeto para a coluna atual
    // Itera sobre cada linha dos dados do Excel
    excelData.forEach((row) => {
      const value = row[column]; // Obtém o valor da coluna atual
      // Verifica se o valor ainda não foi registrado
      if (!analysisData[column][value]) {
        analysisData[column][value] = 1; // Inicializa o contador para este valor
      } else {
        analysisData[column][value]++; // Incrementa o contador se o valor já foi registrado
      }
    });
  });

  criarGraficos(analysisData, columns); // Chama a função para criar gráficos com os dados analisados
  updateFilterOptions(columns); // Chama a função para atualizar as opções de filtro
}

// Função para criar gráficos com os dados de análise
function criarGraficos(analysisData, columns) {
  const cores = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'gray']; // Array de cores para os gráficos
  const chartContainer = document.getElementById('charts'); // Obtém o container onde os gráficos serão renderizados

  chartContainer.innerHTML = ''; // Limpa os gráficos anteriores

  const chartTypeSelect = document.getElementById('chartTypeSelect'); // Obtém o select para escolher o tipo de gráfico

  // Itera sobre cada coluna para criar um gráfico
  columns.forEach((column, index) => {
    const columnData = analysisData[column]; // Obtém os dados da coluna atual
    const labels = Object.keys(columnData); // Obtém os rótulos (valores) da coluna
    const data = Object.values(columnData); // Obtém os contadores dos valores

    const chartDiv = document.createElement('div'); // Cria um novo elemento div para o gráfico
    chartDiv.classList.add('chart-container'); // Adiciona uma classe para o estilo
    chartDiv.id = `chart-${column}`; // Adiciona um ID único ao gráfico
    const canvas = document.createElement('canvas'); // Cria um elemento canvas para renderizar o gráfico
    canvas.id = `${column}Chart`; // Define um ID para o canvas
    chartDiv.innerHTML = `<h3>${column}</h3>`; // Adiciona o título da coluna ao gráfico
    chartDiv.appendChild(canvas); // Adiciona o canvas à div do gráfico
    chartContainer.appendChild(chartDiv); // Adiciona a div do gráfico ao container

    const ctx = canvas.getContext('2d'); // Obtém o contexto 2D do canvas

    // Usa o tipo de gráfico selecionado
    const chartType = chartTypeSelect.value;

    new Chart(ctx, { // Cria uma nova instância do gráfico
      type: chartType, // Tipo de gráfico (barra, linha, etc.)
      data: {
        labels: labels, // Rótulos para o eixo x
        datasets: [{
          label: column, // Rótulo do conjunto de dados
          data: data, // Dados a serem plotados
          backgroundColor: cores.slice(0, labels.length), // Cores para o gráfico
          borderWidth: 1 // Largura da borda
        }]
      },
      options: { // Opções de configuração do gráfico
        responsive: true, // O gráfico se ajusta ao tamanho do container
        scales: { // Configurações dos eixos
          x: {
            beginAtZero: true, // Começa o eixo x do zero
            min: 0, // Mínimo do eixo x
            max: labels.length - 1, // Máximo do eixo x baseado na quantidade de rótulos
          },
          y: {
            beginAtZero: true, // Começa o eixo y do zero
          }
        },
        plugins: {
          zoom: {
            pan: {
              enabled: true, // Permite arrastar (pan) no gráfico
              mode: 'xy', // Ativa o pan nos eixos x e y
            },
            zoom: {
              enabled: true, // Ativa o zoom
              mode: 'xy', // Ativa o zoom nos eixos x e y
              speed: 0.05, // Define a velocidade do zoom
              limits: {
                x: { min: 0, max: labels.length }, // Limita o zoom no eixo x
                y: { min: 0, max: Math.max(...data) * 1.2 } // Limita o zoom no eixo y
              }
            }
          }
        }
      }
    });
  });

  // Atualiza os gráficos quando o tipo de gráfico mudar
  chartTypeSelect.addEventListener('change', function () {
    criarGraficos(analysisData, columns); // Redesenha os gráficos
  });
}

// Função para atualizar as opções de filtro no select
function updateFilterOptions(columns) {
  const filterSelect = document.getElementById('filterSelect'); // Obtém o select para filtros

  // Limpa as opções existentes, exceto a primeira
  filterSelect.innerHTML = '<option value="all">Todos os Gráficos</option>'; // Adiciona a opção 'Todos os Gráficos'

  // Adiciona uma opção para cada coluna
  columns.forEach((column) => {
    const option = document.createElement('option'); // Cria uma nova opção
    option.value = column; // Define o valor da opção
    option.textContent = column; // Define o texto da opção
    filterSelect.appendChild(option); // Adiciona a opção ao select
  });

  // Atualiza a exibição dos gráficos com base na seleção do filtro
  filterSelect.addEventListener('change', function () {
    const selectedValue = this.value; // Obtém o valor selecionado
    const allCharts = document.querySelectorAll('.chart-container'); // Obtém todos os gráficos

    // Itera sobre todos os gráficos
    allCharts.forEach((chart) => {
      if (selectedValue === 'all' || chart.id === `chart-${selectedValue}`) {
        chart.style.display = 'block'; // Exibe o gráfico se selecionado ou se a opção for 'todos'

        // Adiciona a classe "large" para redimensionar o gráfico corretamente
        chart.classList.add('large'); 

        // Redimensiona o gráfico
        const canvas = chart.querySelector('canvas'); // Obtém o canvas dentro do gráfico
        const chartInstance = Chart.getChart(canvas); // Obtém a instância do gráfico
        if (chartInstance) {
          chartInstance.resize(); // Redimensiona o gráfico se a instância existir
        }
      } else {
        chart.style.display = 'none'; // Oculta o gráfico se não for o selecionado
        // Remove a classe "large" quando não está filtrado
        chart.classList.remove('large'); // Remove a classe "large" se o gráfico estiver oculto
      }
    });
  });
}
