import './styles.scss';

import Airtable from 'airtable';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import IIIF from 'ol/source/IIIF';
import IIIFInfo from 'ol/format/IIIFInfo';

var zoomContainer = document.getElementById('zoom-container-outer');

var zoomInitialized = false;

var database = new Airtable({apiKey: 'key10KeIIPJpM8npJ'}).base('appFHShc770eIgtu9');

database('Timeline Objects').select({view: "Grid view", filterByFormula: "{Status} = 'Published'"}).firstPage().then(result => { initialize(result); });

var layer;
var map;


function loadZoomable(imageInfoUrl) {
  fetch(imageInfoUrl).then(function(response) {
    response.json().then(function(imageInfo) {
      var options = new IIIFInfo(imageInfo).getTileSourceOptions();
      if (options === undefined || options.version === undefined) {
        console.log('Data seems to be no valid IIIF image information.');
        return;
      }
      options.zDirection = -1;
      var iiifTileSource = new IIIF(options);
      layer.setSource(iiifTileSource);
      map.setView(new View({
        resolutions: iiifTileSource.getTileGrid().getResolutions(),
        extent: iiifTileSource.getTileGrid().getExtent(),
        constrainOnlyCenter: true
      }));
      map.getView().fit(iiifTileSource.getTileGrid().getExtent());
      console.log(imageInfoUrl);
    }).catch(function() {
      console.log('Could not read image info json');
    });
  }).catch(function() {
    console.log('Could not read data from URL.');
  });
}

// loadZoomable('https://iiif.digitalcommonwealth.org/iiif/2/commonwealth:ht2502616/info.json');


document.addEventListener('click', function (event) {

	if (event.target.matches('.zoom-button')) {
        zoomContainer.style.display = 'block';
        if(!zoomInitialized) {
            layer = new TileLayer();
        map = new Map({
          layers: [layer],
          target: 'zoom-viewer'
        });
        zoomInitialized = true;
        } else {
            layer.setSource(null);
        }
        loadZoomable(event.target.getAttribute('data-iiif') + '/info.json');
        map.render();
	}

	if (event.target.matches('#zoom-closer')) {
		zoomContainer.style.display = 'none';
	}

}, false);



function initialize(slides) {

    var timelineSlides = [];
    slides.forEach(s => { timelineSlides.push( parseSlide(s) ); } );

    const title = {
        text: {
            headline: "Mapping a World of Cities",
            text: `<p>How, where, and why do cities develop? Maps are one of our best tools for answering these questions. Cities are founded and grow in particular locations, driven by geographical features like fresh water or deep harbors as well as historical events like royal charters or speculators’ claims. From the earliest walled towns, individuals and families living in close proximity to one another have shaped urban form by building infrastructure and common space according to their economic, cultural, religious, and military needs. With the rise of nations, empires, and trading networks, cities became linked together, both with other cities and with their own hinterlands.</p>

            <p>Looking at maps helps us to understand the changing geography of urban life. Maps didn’t just serve as snapshots of how cities looked at one moment in time; in the form of plans, maps were also used to build, speculate, and fight over urban form. Historical maps reflect cities’ ethnic and economic transformations, systems of domination and oppression, sites of monumentality and squalor. They capture good times and bad, expansion, decay, and destruction. City dwellers take great pride in their cities, as part of a shared sense of place that is part of a historical trajectory. Maps tell the stories of a city’s past, present—and perhaps its future.</p>
            
            <p><strong>Mapping a World of Cities</strong> is a digital collaboration between [X] map libraries and collections in the United States. From earliest year to latest year, these maps show how world cities changed alongside the changing art and science of cartography. Explore the maps and images, and click through to the host institutions’ pages for more collections.</p>
            
            <p><strong>Sponsored by</strong></p>
            
            <ul>
            <li>Leventhal Map and Education Center at the Boston Public Library</li>
            <li>MacLean Collection</li>
            </ul>
            
            <p><strong>Contributors</strong></p>
            <ul>
            <li>Verygood Map Collection</li>
            <li>Histor Ical Library at the University of the Humanities</li>
            </ul>`
        }
    }

    var timeline = new TL.Timeline('app',{title: title, events: timelineSlides});


    // timeline.config.events.forEach(function(d) { if(d.group != "North America") { timeline.removeId(d.unique_id); console.log("removed" + d.unique_id); } })

}

function parseSlide(s) {

    var explodedDate = s.get('Position Date').split('-')
    var jsonDate = {year: +explodedDate[0], month: +explodedDate[1], day: +explodedDate[2] }

    var thumbnail = s.get('IIIF Endpoint') ? `${s.get('IIIF Endpoint')}/square/500,/0/default.jpg` : '';

    if(s.get('IIIF Endpoint')) {
        var caption = `<button class="zoom-button" data-iiif="${s.get('IIIF Endpoint')}">Zoom in</button>`;
    } else {
        var caption = '';
    }


    return {
        unique_id: s.get('ID'),
        text: {
            headline: fallback(s,'Caption Title'),
        text: `<p>${fallback(s,'Caption')}</p>
        <p class="citation"><span class="object-title">${s.get('Object Title')}</span><br><span class="object-creator">${s.get('Object Creator')}</span><br><span class="object-date">${s.get('Display Date')}</span><br><span class="object-dimensions">${s.get('Dimensions')}</span><br><span class="contributing-institution">${s.get('Contributing Institution')}</span><br><a class="repository-url" href="${s.get('Repository URL')}" target="_blank">Link to Collections Record</a></p>`
        },
        start_date: jsonDate ,
        display_date: s.get('Display Date'),
        group: s.get('Region'),
        media: {
            url: s.get('Image URL'),
            link: s.get('Repository URL'),
            thumbnail: thumbnail,
            caption: caption
        }
    }

}


function fallback(s,field) {
    if( s.get(field) ) { return s.get(field); } else { return `${field} not entered`; }
}