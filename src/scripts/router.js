var Navigo = require('navigo')

var affichage = require('./affichage.js')
var conseils = require('./conseils.js')
var questionnaire = require('./questionnaire.js')

var getCurrentPageName = function () {
    var hash = document.location.hash
    return hash ? hash.slice(1) : ''
}

var redirectToUnansweredQuestions = function (page, profil) {
    if (page === 'introduction') return
    if (page === 'pediatrie') return
    if (page === 'conditionsutilisation') return
    if (page === 'nouvelleversiondisponible') return

    // Questions obligatoires

    if (typeof profil.departement === 'undefined' && page !== 'residence')
        return 'introduction' // aucune réponse = retour à l’accueil

    if (page === 'residence') return

    if (typeof profil.activite_pro === 'undefined' && page !== 'activitepro')
        return 'activitepro'

    if (page === 'activitepro') return

    if (typeof profil.foyer_enfants === 'undefined' && page !== 'foyer') return 'foyer'

    if (page === 'foyer') return

    if (
        (typeof profil.age === 'undefined' || profil.age < 15) &&
        page !== 'caracteristiques'
    )
        return 'caracteristiques'

    if (page === 'caracteristiques') return

    if (typeof profil.antecedent_cardio === 'undefined' && page !== 'antecedents')
        return 'antecedents'

    if (page === 'antecedents') return

    if (typeof profil.symptomes_actuels === 'undefined' && page !== 'symptomesactuels')
        return 'symptomesactuels'

    if (page === 'symptomesactuels') return

    if (profil.symptomes_actuels === true && !profil.symptomes_actuels_autre)
        return page === 'conseils' ? undefined : 'conseils'

    if (typeof profil.symptomes_passes === 'undefined' && page !== 'symptomespasses')
        return 'symptomespasses'

    if (page === 'symptomespasses') return

    if (profil.symptomes_passes === true)
        return page === 'conseils' ? undefined : 'conseils'

    if (typeof profil.contact_a_risque === 'undefined' && page !== 'contactarisque')
        return 'contactarisque'

    if (page === 'contactarisque') return

    return page === 'conseils' ? undefined : 'conseils'
}

var loadPage = function (pageName) {
    var page = document.querySelector('section#page')
    var section = document.querySelector('#' + pageName)
    var clone = section.cloneNode(true)
    page.innerHTML = '' // Flush the current content.
    var element = page.insertAdjacentElement('afterbegin', clone.firstElementChild)
    if (pageName !== 'introduction') {
        element.scrollIntoView({ behavior: 'smooth' })
    }
    return element
}

function initRouter(profil, stockageLocal) {
    var root = null
    var useHash = true
    var router = new Navigo(root, useHash)

    // Workaround unwanted behaviour in Navigo
    if (router.root.slice(-1) !== '/') {
        router.root = router.root + '/'
    }

    router.hooks({
        before: function (done) {
            // Global hook to redirect on the correct page given registered data.
            var requestedPage = getCurrentPageName() || 'introduction'
            var redirectedPage = redirectToUnansweredQuestions(requestedPage, profil)
            if (redirectedPage) {
                router.navigate(redirectedPage)
            }
            done()
        },
        after: function () {
            // Global hook to send a custom event on each page change.
            var pageName = getCurrentPageName()
            var customPageEvent = document.createEvent('CustomEvent')
            customPageEvent.initCustomEvent(
                'pageChanged:' + pageName,
                true,
                true,
                pageName
            )
            document.dispatchEvent(customPageEvent)
        },
    })

    router
        .on(new RegExp('^introduction$'), function () {
            var pageName = 'introduction'
            var element = loadPage(pageName)
            if (profil.isComplete()) {
                affichage.displayElement(element, 'js-profil-full')
                affichage.hideElement(element.querySelector('#js-profil-empty'))
                var mesConseilsLink = element.querySelector('#mes-conseils-link')
                var target = redirectToUnansweredQuestions('findCorrectExit', profil)
                mesConseilsLink.setAttribute('href', '#' + target)
            }
        })
        .on(new RegExp('^residence$'), function () {
            var pageName = 'residence'
            var form = loadPage(pageName)
            questionnaire.residence(form, profil, stockageLocal, router)
        })
        .on(new RegExp('^activitepro$'), function () {
            var pageName = 'activitepro'
            var form = loadPage(pageName)
            questionnaire.activitepro(form, profil, stockageLocal, router)
        })
        .on(new RegExp('^foyer$'), function () {
            var pageName = 'foyer'
            var form = loadPage(pageName)
            questionnaire.foyer(form, profil, stockageLocal, router)
        })
        .on(new RegExp('^caracteristiques$'), function () {
            var pageName = 'caracteristiques'
            var form = loadPage(pageName)
            questionnaire.caracteristiques(form, profil, stockageLocal, router)
        })
        .on(new RegExp('^antecedents$'), function () {
            var pageName = 'antecedents'
            var form = loadPage(pageName)
            questionnaire.antecedents(form, profil, stockageLocal, router)
        })
        .on(new RegExp('^symptomesactuels$'), function () {
            var pageName = 'symptomesactuels'
            var form = loadPage(pageName)
            questionnaire.symptomesactuels(form, profil, stockageLocal, router)
        })
        .on(new RegExp('^symptomespasses$'), function () {
            var pageName = 'symptomespasses'
            var form = loadPage(pageName)
            questionnaire.symptomespasses(form, profil, stockageLocal, router)
        })
        .on(new RegExp('^contactarisque$'), function () {
            var pageName = 'contactarisque'
            var form = loadPage(pageName)
            questionnaire.contactarisque(form, profil, stockageLocal, router)
        })
        .on(new RegExp('^conseils$'), function () {
            var pageName = 'conseils'
            var element = loadPage(pageName)
            conseils(element, profil, stockageLocal, router)
        })
        .on(new RegExp('^pediatrie$'), function () {
            var pageName = 'pediatrie'
            var element = loadPage(pageName)
            if (profil.isComplete()) {
                affichage.displayElement(element, 'js-profil-full')
                affichage.hideElement(element.querySelector('#js-profil-empty'))
                var mesConseilsLink = element.querySelector('#mes-conseils-link')
                var target = redirectToUnansweredQuestions('findCorrectExit', profil)
                mesConseilsLink.setAttribute('href', '#' + target)
            }
        })
        .on(new RegExp('^conditionsutilisation$'), function () {
            var pageName = 'conditionsutilisation'
            loadPage(pageName)
        })
        .on(new RegExp('^nouvelleversiondisponible$'), function () {
            var pageName = 'nouvelleversiondisponible'
            loadPage(pageName)
        })
        .notFound(function () {
            router.navigate('introduction')
        })

    return router
}

module.exports = {
    getCurrentPageName,
    redirectToUnansweredQuestions,
    initRouter,
}