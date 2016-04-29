$(".btn-success").on("click", function(){
	var $this = $(this);
	var show_id = $this.attr("show");
	$this.parent().parent().removeClass('new').addClass('done');
	$.ajax({
			method: "GET",
			url: "/update/" + show_id,
	}).done(function (data) {
		// ajax success
		$this.parent().siblings().children(".last").children('span').text(data.current);
	})
});