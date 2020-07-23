var carteDepartements = require('./carte.js')
var affichage = require('./affichage.js')

module.exports = {
    nomProfil: function (element, app) {
        if (!element) return
        element.textContent = app.profil.affichageNom()
    },

    titreConseils: function (element, profil) {
        if (!element) return
        if (profil.estMonProfil()) return
        affichage.showElement(element)
        element.textContent = `Conseils pour « ${profil.nom} »`
    },

    departement: function (element, departement) {
        element.textContent = carteDepartements.nom(departement)
    },

    lienPrefecture: function (element, departement) {
        element.setAttribute('href', carteDepartements.lien_prefecture(departement))
    },

    caracteristiquesARisques: function (element, algoOrientation) {
        if (
            algoOrientation.sup65 ||
            algoOrientation.profil.grossesse_3e_trimestre ||
            algoOrientation.imc > 30
        ) {
            var content = ''
            if (algoOrientation.sup65) {
                content = 'vous êtes âgé·e de plus de 65 ans'
            } else if (algoOrientation.profil.grossesse_3e_trimestre) {
                content = 'vous êtes au 3e trimestre de votre grossesse'
            }
            if (algoOrientation.imc > 30) {
                content += content ? ' et ' : ''
                content +=
                    'vous avez un IMC supérieur à 30 (' +
                    Math.round(algoOrientation.imc) +
                    ')'
            }
            content += '.'
            element.textContent = content
        }
    },

    antecedents: function (element, algoOrientation) {
        if (
            algoOrientation.antecedents ||
            algoOrientation.profil.antecedent_chronique_autre
        ) {
            var content = ''
            if (algoOrientation.antecedents) {
                content = 'Vous avez des antécédents à risque'
            }
            if (algoOrientation.profil.antecedent_chronique_autre) {
                content += content ? ' et vous ' : 'Vous '
                content +=
                    'avez une maladie chronique, un handicap ' +
                    'ou vous prenez un traitement au long cours'
            }
            content += '.'
            element.textContent = content
        }
    },

    symptomesactuels: function (element, algoOrientation) {
        if (algoOrientation.symptomesActuelsReconnus) {
            var symptomes = []
            if (
                algoOrientation.profil.symptomes_actuels_temperature ||
                algoOrientation.profil.symptomes_actuels_temperature_inconnue
            ) {
                symptomes.push('vous avez de la température (ou vous ne savez pas)')
            }
            if (algoOrientation.profil.symptomes_actuels_toux) {
                symptomes.push('vous avez de la toux')
            }
            if (algoOrientation.profil.symptomes_actuels_odorat) {
                symptomes.push('vous avez perdu l’odorat')
            }
            if (algoOrientation.profil.symptomes_actuels_douleurs) {
                symptomes.push('vous avez des douleurs')
            }
            if (algoOrientation.profil.symptomes_actuels_diarrhee) {
                symptomes.push('vous avez de la diarrhée')
            }
            if (algoOrientation.profil.symptomes_actuels_fatigue) {
                symptomes.push('vous êtes fatigué·e')
            }
            if (algoOrientation.profil.symptomes_actuels_alimentation) {
                symptomes.push('vous avez arrêté de boire ou de manger')
            }
            if (algoOrientation.profil.symptomes_actuels_souffle) {
                symptomes.push('vous êtes essouflé·e')
            }
            var content = symptomes.join(' ; ') + '.'
            element.textContent = content
        }
    },
}
