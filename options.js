function DomainCtrl($scope){
	$scope.accounts = localStorage.accounts? JSON.parse(localStorage.accounts) : [];
	
	$scope.remove = function(account,$event){
		$event.preventDefault();
		$scope.accounts.splice($scope.accounts.indexOf(account), 1);
	};
	
	$scope.add = function($event){
		$event.preventDefault();
		$scope.accounts.push({
			domain: "",
			ga: "",
			homePage: ""
		});
	};
	
	$scope.save = function($event){
		localStorage.accounts = JSON.stringify($scope.accounts);
	};
}