/*! SocialCount - v0.1.0 - 2012-07-24
* https://github.com/filamentgroup/SocialCount
* Copyright (c) 2012 zachleat; Licensed MIT */

(function( win, doc, $ ) {

	// TODO: get running with wrap

	var $loadingIndicator,
		$count,
		cache = {};

	function featureTest( prop, unprefixedProp )
	{
		var style = doc.createElement('social').style,
			prefixes = 'webkit Moz o ms'.split(' ');

		if( unprefixedProp in style ) {
			return true;
		}
		for( var j = 0, k = prefixes.length; j < k; j++ ) {
			if( ( prefixes[ j ] + prop ) in style ) {
				return true;
			}
		}
		return false;
	}

	var SocialCount = {
		showCounts: true,
		minCount: 0,
		serviceUrl: 'lib/socialcount/service/index.php',
		initSelector: '.socialcount',
		jsClass: 'js',
		activeClass: 'active',
		noTransformsClass: 'no-transforms',
		showCountsClass: 'counts',
		countContentClass: 'count',
		minCountClass: 'minimum',
		thousandCharacter: 'K',
		millionCharacter: 'M',
		missingResultText: '-',
		classes: {
			facebook: '.facebook',
			twitter: '.twitter',
			googleplus: '.googleplus'
		},

		isCssAnimations: function()
		{
			return featureTest( 'AnimationName', 'animationName' );
		},
		isCssTransforms: function()
		{
			return featureTest( 'Transform', 'transform' );
		},
		init: function( $el ) {
			var map = SocialCount.classes,
				counts = {},
				url = $el.attr('data-url') || location.href,
				facebookAction = ( $el.attr('data-facebook-action' ) || 'like' ).toLowerCase(),
				classes = [ SocialCount.jsClass, facebookAction ],
				isSmall = $el.is( '.socialcount-small' ),
				$networkNode,
				$countNode;

			if( !SocialCount.isCssTransforms() ) {
				classes.push( SocialCount.noTransformsClass );
			}
			if( SocialCount.showCounts ) {
				classes.push( SocialCount.showCountsClass );
			}
			$el.addClass( classes.join(' ') );

			if( SocialCount.showCounts && !isSmall ) {
				for( var j in map ) {
					$networkNode = $el.find( map[ j ] );
					$countNode = $networkNode.find( '.' + SocialCount.countContentClass );

					if( $countNode.length ) {
						counts[ j ] = $countNode;
					} else {
						counts[ j ] = $count.clone();
						$networkNode.append( counts[ j ] );
					}
				}

				if( !cache[ url ] ) {
					cache[ url ] = SocialCount.fetch( url );
				}
console.log(counts.facebook[0], counts.twitter[0]);
				cache[ url ].done( function complete( data )
				{
					for( var j in data ) {
						if( data.hasOwnProperty( j ) ) {
							if( data[ j ] >= SocialCount.minCount && counts[ j ] ) {
								counts[ j ].addClass( SocialCount.minCountClass )
									.html( SocialCount.normalizeCount( data[ j ] ) );
							}
						}
					}
				});
			}

			if( 'querySelectorAll' in doc && !( win.blackberry && !win.WebKitPoint )) {
				SocialCount.bindEvents( $el, url, facebookAction, isSmall );
			}
		},
		fetch: function( url ) {
			return $.ajax({
				url: SocialCount.serviceUrl,
				data: {
					url: url
				},
				dataType: 'json'
			});
		},
		normalizeCount: function( count )
		{
			if( !count && count !== 0 ) {
				return SocialCount.missingResultText;
			}
			// > 1M
			if( count >= 1000000 ) {
				return Math.floor( count / 1000000 ) + SocialCount.millionCharacter;
			}
			// > 100K
			if( count >= 100000 ) {
				return Math.floor( count / 1000 ) + SocialCount.thousandCharacter;
			}
			if( count > 1000 ) {
				return ( count / 1000 ).toFixed(1).replace( /\.0/, '' ) + SocialCount.thousandCharacter;
			}
			return count;
		},
		bindEvents: function( $el, url, facebookAction, isSmall )
		{
			function removeLoader( $parent, $loading )
			{
				var $iframe = $parent.find('iframe');

				if( $iframe.length ) {
					$iframe.bind( 'load', function() {
						$loading.remove();
					});
				} else {
					$loading.remove();
				}
			}

			function bind( $a, html, jsUrl )
			{
				$a.one( 'click', function( event ) {
						$( this ).trigger( 'mouseover' );
						event.preventDefault();
					}).one( 'mouseover', function() {
						var $self = $( this ),
							$parent = $self.closest( 'li' ),
							$loading = $loadingIndicator.clone(),
							$content = $( html ),
							$button = $( '<div class="button"/>' ).append( $content ),
							js,
							$iframe;

						$parent
							.addClass( SocialCount.activeClass )
							.append( $loading )
							.append( $button );

						if( jsUrl ) {
							js = doc.createElement( 'script' );
							js.src = jsUrl;

							// IE8 doesn't do script onload.
							if( js.attachEvent ) {
								js.attachEvent( 'onreadystatechange', function()
								{
									if( js.readyState === 'complete' ) {
										removeLoader( $parent, $loading );
									}
								});
							} else {
								$(js).bind( 'load', function() {
									removeLoader( $parent, $loading );
								});
							}

							doc.body.appendChild( js );
						} else if( $content.is( 'iframe' ) ) {
							removeLoader( $parent, $loading );
						}
					});
			}

			if( !isSmall ) {
				bind( $el.find( SocialCount.classes.facebook + ' a' ),
					'<iframe src="//www.facebook.com/plugins/like.php?href=' + encodeURI( url ) + '&amp;send=false&amp;layout=button_count&amp;width=100&amp;show_faces=true&amp;action=' + facebookAction + '&amp;colorscheme=light&amp;font=arial&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden;" allowTransparency="true"></iframe>' );

				bind( $el.find( SocialCount.classes.twitter + ' a' ),
					'<a href="https://twitter.com/share" class="twitter-share-button" data-count="none">Tweet</a>',
					'//platform.twitter.com/widgets.js' );

				bind( $el.find( SocialCount.classes.googleplus + ' a' ),
					'<div class="g-plusone" data-size="medium" data-annotation="none"></div>',
					'//apis.google.com/js/plusone.js' );
			}
		}
	};

	$(function() {
		// Thanks to http://codepen.io/ericmatthys/pen/FfcEL
		$loadingIndicator = $('<div>')
			.addClass('loading')
			.html( SocialCount.isCssAnimations() ? new Array(4).join('<div class="dot"></div>') : 'Loading' );

		if( SocialCount.showCounts ) {
			$count = $('<span>')
				.addClass( SocialCount.countContentClass )
				.html('&#160;');
		}

		$( SocialCount.initSelector ).each(function()
		{
			var $el = $(this);
			SocialCount.init($el);
		});
	});

	window.SocialCount = SocialCount;

}( window, window.document, jQuery ));