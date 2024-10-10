// app.js
var app = angular.module('myApp', []);

app.controller('myCtrl', ['$scope', '$http', function($scope, $http) {
    // Initialize variables
    const vm = this;

    $scope.runs = results;
    $scope.selectedRun = null;
    $scope.isLoading = false;
    $scope.detailedMetrics = [];
    var charts = {};
    $scope.selectRun = function(run) {
        if ($scope.selectedRun === run) {
            return; // Run already selected
        }
        $scope.selectedRun = run;
        loadRunData(run);
    };
    function loadRunData(run) {
		$scope.isLoading = true; // Start loading
        $scope.detailedMetrics = []; // Reset detailed metrics
        $scope.$applyAsync();
		$.ajax({
			url: `results/result_${run}.json`,
			method: 'GET',
			dataType: 'text', // Fetch as plain text to handle NDJSON
			success: function(data) {
				var parsedData = parseNDJSON(data);
				processData(parsedData);
				$scope.isLoading = false; // End loading
				$scope.$apply();
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.error('Error loading run data:', textStatus, errorThrown);
				$scope.isLoading = false; // End loading even on error
				$scope.$apply();
			}
		});
		
    }
    function parseNDJSON(ndjson) {
        var lines = ndjson.trim().split('\n');
        var jsonObjects = lines.map(function(line) {
            try {
                return JSON.parse(line);
            } catch (e) {
                console.error('Invalid JSON line:', line);
                return null;
            }
        }).filter(function(obj) { return obj !== null; });
        return jsonObjects;
    }

    function processData(data) {
        var metrics = {};
        data.forEach(function(item) {
            if (item.type === 'Metric') {
                var metricName = item.data.name;
                if (!metrics[metricName]) {
                    metrics[metricName] = {
                        type: item.data.type,
                        dataPoints: []
                    };
                }
            } else if (item.type === 'Point') {
                var metricName = item.metric;
                if (!metrics[metricName]) {
                    metrics[metricName] = {
                        type: 'unknown',
                        dataPoints: []
                    };
                }
                metrics[metricName].dataPoints.push({
                    time: new Date(item.data.time),
                    value: item.data.value,
                    tags: item.data.tags
                });
            }
        });
        extractDetailedMetrics(metrics);
        plotCharts(metrics);
    }

    function extractDetailedMetrics(metrics) {
        $scope.detailedMetrics = [];
        for (var metricName in metrics) {
            if (metrics.hasOwnProperty(metricName)) {
                var metric = metrics[metricName];
                var latestPoint = metric.dataPoints.reduce(function(prev, current) {
                    return (prev.time > current.time) ? prev : current;
                }, metric.dataPoints[0]);

                $scope.detailedMetrics.push({
                    name: metricName,
                    value: latestPoint.value,
                    tags: latestPoint.tags
                });
            }
        }
    }

    function plotCharts(metrics) {
        // Example Chart: HTTP Requests Over Time
        if (metrics['http_reqs']) {
            plotHttpRequestsChart(metrics['http_reqs'].dataPoints);
        }
        // Example Chart: HTTP Request Duration Over Time
        if (metrics['http_req_duration']) {
            plotHttpReqDurationChart(metrics['http_req_duration'].dataPoints);
        }
        // Example Chart: HTTP Request Failed Rate Over Time
        if (metrics['http_req_failed']) {
            plotHttpReqFailedChart(metrics['http_req_failed'].dataPoints);
        }
        // Example Chart: Checks Pass Rate Over Time
        if (metrics['checks']) {
            plotChecksChart(metrics['checks'].dataPoints);
        }
        // Example Chart: Throughput (Requests/sec)
        if (metrics['http_reqs']) {
            plotThroughputChart(metrics['http_reqs'].dataPoints);
        }
        // Example Chart: Error Rate (%) Over Time
        if (metrics['http_req_failed']) {
            plotErrorRateChart(metrics['http_req_failed'].dataPoints);
        }
        // Example Chart: Active Virtual Users (VUs) Over Time
        if (metrics['vus']) {
            plotActiveVUsChart(metrics['vus'].dataPoints);
        }
        // Example Chart: Response Time Percentiles (p90, p95, p99)
        if (metrics['http_req_duration_p90'] && metrics['http_req_duration_p95'] && metrics['http_req_duration_p99']) {
            plotResponseTimePercentilesChart({
                p90: metrics['http_req_duration_p90'].dataPoints,
                p95: metrics['http_req_duration_p95'].dataPoints,
                p99: metrics['http_req_duration_p99'].dataPoints
            });
        }
        // Example Chart: SLA Compliance Over Time
        if (metrics['http_req_duration']) { // Assuming SLA is based on response time
            plotSLAComplianceChart(metrics['http_req_duration'].dataPoints, 1000); // Example SLA: 1000 ms
        }
        // Example Chart: Response Time Distribution (Histogram)
        if (metrics['http_req_duration']) {
            plotResponseTimeHistogramChart(metrics['http_req_duration'].dataPoints);
        }
    }

    function plotHttpRequestsChart(dataPoints) {
        var labels = dataPoints.map(function(point) { return point.time.toLocaleTimeString(); });
        var data = dataPoints.map(function(point) { return point.value; });
        var ctx = document.getElementById('httpRequestsChart').getContext('2d');
        if (charts['httpRequestsChart']) {
            charts['httpRequestsChart'].destroy();
        }

        charts['httpRequestsChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'HTTP Requests',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        title: { display: true, text: 'Time' }
                    },
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Requests' }
                    }
                }
            }
        });
    }

    function plotHttpReqDurationChart(dataPoints) {
        var labels = dataPoints.map(function(point) { return point.time.toLocaleTimeString(); });
        var data = dataPoints.map(function(point) { return point.value; });

        var ctx = document.getElementById('httpReqDurationChart').getContext('2d');

        if (charts['httpReqDurationChart']) {
            charts['httpReqDurationChart'].destroy();
        }

        charts['httpReqDurationChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'HTTP Request Duration (ms)',
                    data: data,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        title: { display: true, text: 'Time' }
                    },
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Duration (ms)' }
                    }
                }
            }
        });
    }

    function plotHttpReqFailedChart(dataPoints) {
        var labels = dataPoints.map(function(point) { return point.time.toLocaleTimeString(); });
        var data = dataPoints.map(function(point) { return (point.value * 100).toFixed(2); }); // Convert rate to percentage
        var ctx = document.getElementById('httpReqFailedChart').getContext('2d');
        if (charts['httpReqFailedChart']) {
            charts['httpReqFailedChart'].destroy();
        }
        charts['httpReqFailedChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'HTTP Request Failed Rate (%)',
                    data: data,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        title: { display: true, text: 'Time' }
                    },
                    y: { 
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Failed Requests (%)' }
                    }
                }
            }
        });
    }

    function plotChecksChart(dataPoints) {
        var labels = dataPoints.map(function(point) { return point.time.toLocaleTimeString(); });
        var data = dataPoints.map(function(point) { return (point.value * 100).toFixed(2); }); // Convert rate to percentage

        var ctx = document.getElementById('checksChart').getContext('2d');

        if (charts['checksChart']) {
            charts['checksChart'].destroy();
        }

        charts['checksChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Checks Pass Rate (%)',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        title: { display: true, text: 'Time' }
                    },
                    y: { 
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Pass Rate (%)' }
                    }
                }
            }
        });
    }

    function plotThroughputChart(dataPoints) {
        var labels = dataPoints.map(function(point) { return point.time.toLocaleTimeString(); });
        var data = dataPoints.map(function(point) { return point.value; });
        var ctx = document.getElementById('throughputChart').getContext('2d');

        if (charts['throughputChart']) {
            charts['throughputChart'].destroy();
        }

        charts['throughputChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Throughput (Requests/sec)',
                    data: data,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        title: { display: true, text: 'Time' }
                    },
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Requests/sec' }
                    }
                }
            }
        });
    }

    function plotErrorRateChart(dataPoints) {
        var labels = dataPoints.map(function(point) { return point.time.toLocaleTimeString(); });
        var data = dataPoints.map(function(point) { return (point.value * 100).toFixed(2); }); // Convert rate to percentage

        var ctx = document.getElementById('errorRateChart').getContext('2d');

        if (charts['errorRateChart']) {
            charts['errorRateChart'].destroy();
        }

        charts['errorRateChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Error Rate (%)',
                    data: data,
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        title: { display: true, text: 'Time' }
                    },
                    y: { 
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Error Rate (%)' }
                    }
                }
            }
        });
    }

    function plotActiveVUsChart(dataPoints) {
        var labels = dataPoints.map(function(point) { return point.time.toLocaleTimeString(); });
        var data = dataPoints.map(function(point) { return point.value; });

        var ctx = document.getElementById('activeVUsChart').getContext('2d');

        if (charts['activeVUsChart']) {
            charts['activeVUsChart'].destroy();
        }

        charts['activeVUsChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Active Virtual Users (VUs)',
                    data: data,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        title: { display: true, text: 'Time' }
                    },
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Number of VUs' }
                    }
                }
            }
        });
    }

    function plotResponseTimePercentilesChart(percentilesData) {
        var labels = percentilesData.p90.map(function(point) { return point.time.toLocaleTimeString(); });
        var p90 = percentilesData.p90.map(function(point) { return point.value; });
        var p95 = percentilesData.p95.map(function(point) { return point.value; });
        var p99 = percentilesData.p99.map(function(point) { return point.value; });

        var ctx = document.getElementById('responseTimePercentilesChart').getContext('2d');

        if (charts['responseTimePercentilesChart']) {
            charts['responseTimePercentilesChart'].destroy();
        }

        charts['responseTimePercentilesChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'p90',
                        data: p90,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'p95',
                        data: p95,
                        borderColor: 'rgba(153, 102, 255, 1)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'p99',
                        data: p99,
                        borderColor: 'rgba(255, 159, 64, 1)',
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        title: { display: true, text: 'Time' }
                    },
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Response Time (ms)' }
                    }
                }
            }
        });
    }

    function plotSLAComplianceChart(dataPoints, slaThreshold) {
        // Calculate SLA compliance (percentage of requests under the threshold)
        var labels = [];
        var compliance = [];

        dataPoints.forEach(function(point, index, array) {
            labels.push(point.time.toLocaleTimeString());

            // Define a window size, e.g., last 10 data points
            var windowSize = 10;
            var windowStart = Math.max(0, index - windowSize + 1);
            var window = array.slice(windowStart, index + 1);
            var compliant = window.filter(p => p.value <= slaThreshold).length;
            var percentage = ((compliant / window.length) * 100).toFixed(2);
            compliance.push(percentage);
        });

        var ctx = document.getElementById('slaComplianceChart').getContext('2d');

        if (charts['slaComplianceChart']) {
            charts['slaComplianceChart'].destroy();
        }

        charts['slaComplianceChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'SLA Compliance (%)',
                        data: compliance,
                        backgroundColor: 'rgba(255, 206, 86, 0.2)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1,
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: 'SLA Threshold (' + slaThreshold + ' ms)',
                        data: Array(compliance.length).fill(slaThreshold),
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        borderDash: [10,5],
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        title: { display: true, text: 'Time' }
                    },
                    y: { 
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Compliance (%)' }
                    }
                }
            }
        });
    }

    function plotResponseTimeHistogramChart(dataPoints) {
        // Define bins
        var bins = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
        var binLabels = [];
        for (var i = 0; i < bins.length -1; i++) {
            binLabels.push(bins[i] + '-' + bins[i+1] + 'ms');
        }

        // Initialize counts
        var counts = Array(binLabels.length).fill(0);

        // Populate counts
        dataPoints.forEach(function(point) {
            var loadTime = point.value;
            for (var i = 0; i < bins.length -1; i++) {
                if (loadTime >= bins[i] && loadTime < bins[i+1]) {
                    counts[i]++;
                    break;
                }
            }
        });

        var ctx = document.getElementById('responseTimeHistogramChart').getContext('2d');

        if (charts['responseTimeHistogramChart']) {
            charts['responseTimeHistogramChart'].destroy();
        }

        charts['responseTimeHistogramChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: 'Number of Responses',
                    data: counts,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { 
                        title: { display: true, text: 'Response Time (ms)' }
                    },
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Responses' }
                    }
                }
            }
        });
    }

    $scope.exportChart = function(chartId) {
        var canvas = document.getElementById(chartId);
        if (!canvas) {
            alert('Chart not found!');
            return;
        }
        var link = document.createElement('a');
        link.href = canvas.toDataURL("image/png");
        link.download = chartId + '.png';
        document.body.appendChild(link); // Required for Firefox

        link.click(); // This will download the data
        document.body.removeChild(link);
    };

    $scope.exportTable = function() {
        if (!$scope.selectedRun) {
            alert('No run selected!');
            return;
        }

        var csvContent = "data:text/csv;charset=utf-8,Metric,Value,Tags\n";
        $scope.detailedMetrics.forEach(function(metric) {
            var tags = Object.entries(metric.tags).map(([key, val]) => key + '=' + val).join('; ');
            csvContent += `"${metric.name}","${metric.value}","${tags}"\n`;
        });

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", $scope.selectedRun.runId + "_detailed_metrics.csv");
        document.body.appendChild(link); // Required for Firefox

        link.click(); // This will download the data
        document.body.removeChild(link);
    };

    vm.allData = [];
    vm.metrix = [];
    vm.stats = [];
    vm.selectedMetric = '';
    vm.selectedStat = '';
    vm.chartData = [];
    vm.chartLabels = [];
    vm.chartSeries = [];
    vm.chartOptions = {};
    vm.details = [];
    vm.chart = null;

    vm.loadAllData = function () {
        const promises = $scope.runs.map(file => $http.get(`results/summary_${file}.json`).then(response => {
            // Attach filename to data for timestamp extraction
            response.data.options = response.data.options || {};
            response.data.options.filename = file;
            return response.data;
        }).catch(error => {
            console.error('Error loading file:', file, error);
            return null; // Return null for failed requests
        }));

        Promise.all(promises).then(results => {
            // Filter out any failed requests
            vm.allData = results.filter(data => data !== null);
            vm.processMetrics();
            vm.loading = false;
            $scope.$apply(); // Update the scope
        });
    };
    vm.processMetrics = function () {
        if (vm.allData.length === 0) return;
        // Assuming all JSON files have the same structure
        const sampleMetrics = vm.allData[0].metrics;
        vm.metrix = Object.keys(sampleMetrics);
        // Initialize selectedMetric and selectedStat
        vm.selectedMetric = vm.metrix[0];
        vm.stats = Object.keys(vm.allData[0].metrics[vm.selectedMetric].values);
        vm.selectedStat = vm.stats[0];
        vm.initializeChart();
        // Initial chart rendering
       // vm.updateChartData();
    };

    vm.initializeChart = function () {
       // const ctx = document.getElementById('trendChart').getContext('2d');
        const ctx = document.getElementById('trendChart').getContext('2d');
        vm.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                aspectRatio:3,
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Timestamp'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        enabled: true
                    }
                }
            }

        });

        vm.updateChartData();
    };

    vm.updateChart = function () {
        vm.updateChartData();
    };

    vm.updateChartData = function () {
        if (!vm.selectedMetric || !vm.selectedStat) return;
        let dataPoints = [];
        let details = [];

        vm.allData.forEach(entry => {
            // Extract timestamp from filename
            const filename = entry.options.filename || 'summary_??????????????.json';
            const timestamp = vm.extractTimestampFromFilename(filename);

            const metricValues = entry.metrics[vm.selectedMetric].values;
            const value = metricValues[vm.selectedStat];
            dataPoints.push({
                x: timestamp,
                y: value
            });

            details.push({
                timestamp: timestamp,
                value: value
            });
        });

        dataPoints.sort((a, b) => new Date(a.x) - new Date(b.x));
        details.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        vm.chartSeries = [vm.selectedStat];

        vm.chart.data.labels = dataPoints.map(dp => dp.x);
        vm.chart.data.datasets[0].label = `${vm.selectedMetric} - ${vm.selectedStat}`;
        vm.chart.data.datasets[0].data = dataPoints.map(dp => dp.y);
        vm.chart.update();
        vm.details = details;
    };

    // Function to extract and format timestamp from filename
    vm.extractTimestampFromFilename = function (ts) {
            return `${ts.substring(0,4)}-${ts.substring(4,6)}-${ts.substring(6,8)} ` +
                              `${ts.substring(8,10)}:${ts.substring(10,12)}:${ts.substring(12,14)}`;
            
    };

    $scope.$watch(function () {
        return vm.selectedMetric;
    }, function (newVal, oldVal) {
        if (newVal !== oldVal) {
            if (vm.allData.length > 0 && vm.allData[0].metrics[newVal]) {
                vm.stats = Object.keys(vm.allData[0].metrics[newVal].values);
                vm.selectedStat = vm.stats[0];
                vm.updateChartData();
            }
        }
    });

    vm.loadAllData();

}]);
