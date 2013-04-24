(function($) {
/*
		======== A Handy Little QUnit Reference ========
		http://docs.jquery.com/QUnit

		Test methods:
			expect(numAssertions)
			stop(increment)
			start(decrement)
		Test assertions:
			ok(value, [message])
			equal(actual, expected, [message])
			notEqual(actual, expected, [message])
			deepEqual(actual, expected, [message])
			notDeepEqual(actual, expected, [message])
			strictEqual(actual, expected, [message])
			notStrictEqual(actual, expected, [message])
			raises(block, [expected], [message])
*/

	module("jQuery#idle-timer");

	asyncTest( "default behavior", function() {
		expect( 1 );

		$( document ).on( "idle.idleTimer", function(){
			ok( true, "idleTime fires at document by default" );
			start();
		});
		$.idleTimer( 100 );
	});

}(jQuery));
