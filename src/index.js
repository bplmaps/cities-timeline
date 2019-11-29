import './styles.scss';

import Airtable from 'airtable';

var database = new Airtable({apiKey: 'key10KeIIPJpM8npJ'}).base('appFHShc770eIgtu9');

database('Timeline Objects').select({view: "Grid view", filterByFormula: "{Status} = 'Published'"}).firstPage().then(result => { initialize(result); });

function initialize(slides) {

    var timelineSlides = [];
    slides.forEach(s => { timelineSlides.push( parseSlide(s) ); } );

    var timeline = new TL.Timeline('app',{events: timelineSlides});

}

function parseSlide(s) {

    var explodedDate = s.get('Position Date').split('-')
    var jsonDate = {year: +explodedDate[0], month: +explodedDate[1], day: +explodedDate[2] }

    var thumbnail = s.get('IIIF Endpoint') ? `${s.get('IIIF Endpoint')}/square/500,/0/default.jpg` : '';

    return {
        unique_id: s.get('ID'),
        text: {
            headline: s.get('Caption Title'),
        text: `<p>${s.get('Caption')}</p><p class="object-title">${s.get('Object Title')}</p><p class="object-creator">${s.get('Object Creator')}</p><p class="contributing-institution">${s.get('Contributing Institution')}</p>`
        },
        start_date: jsonDate ,
        display_date: s.get('Display Date'),
        media: {
            url: s.get('Image URL'),
            link: s.get('Repository URL'),
            thumbnail: thumbnail
        }
    }

}

