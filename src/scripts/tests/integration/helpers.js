export async function getPlausibleTrackingEvents(page) {
    return await page.evaluate(() => {
        return window.app._plausibleTrackingEvents
    })
}

export async function waitForPlausibleTrackingEvent(page, name) {
    await page.waitForFunction((name) => {
        return window.app._plausibleTrackingEvents.includes(name)
    }, name)
    return await getPlausibleTrackingEvents(page)
}

export async function waitForPlausibleTrackingEvents(page, names) {
    await page.waitForFunction(
        (events) =>
            window.app._plausibleTrackingEvents.length === events.length &&
            window.app._plausibleTrackingEvents.every(
                (val, index) => val === events[index]
            ),
        names,
        { timeout: 2000 }
    )
}

export async function remplirQuestionnaire(page, choix) {
    await remplirSymptomesActuels(page, choix.symptomesActuels)
    if (choix.symptomesActuels.length) {
        await remplirDebutSymptomes(page, choix.debutSymptomes)
    } else {
        await remplirSymptomesPasses(page, choix.symptomesPasses)
        if (choix.symptomesPasses) {
            await remplirDebutSymptomes(page, choix.debutSymptomes)
        } else {
            await remplirContactsARisque(page, choix.contactARisque)
        }
    }
    await remplirDepistage(page, choix.depistage, choix.depistageResultat)
    await remplirDepartement(page, choix.departement)
    await remplirFoyer(page, choix.enfants)
    await remplirAntecedents(page, choix.antecedents || [])
    await remplirCaracteristiques(page, choix.age, choix.taille, choix.poids)
    if (choix.age < 15) return
    await remplirActivite(page, choix.activitePro)
}

async function remplirDepartement(page, departement) {
    await page.selectOption('#page select#departement', departement)
    let bouton = await page.waitForSelector('#page >> text="Continuer"')
    await Promise.all([bouton.click(), page.waitForNavigation({ url: '**/#foyer' })])
}

async function remplirFoyer(page, enfants) {
    if (enfants === true) {
        // Je n’arrive pas à cocher la case directement, alors je clique sur le label
        let label
        label = await page.waitForSelector('#page label[for="foyer_enfants"]')
        await label.click()
    }

    // TODO: personnes fragiles

    let bouton = await page.waitForSelector('#page >> text="Continuer"')
    await Promise.all([
        bouton.click(),
        page.waitForNavigation({ url: '**/#antecedents' }),
    ])
}

async function remplirAntecedents(page, antecedents) {
    let bouton
    let label
    if (antecedents.length) {
        antecedents.forEach(async (antecedent) => {
            label = await page.waitForSelector(
                `#page label[for="antecedent_${antecedent}"]`
            )
            await label.click()
        })
        bouton = await page.waitForSelector('#page >> text=Continuer')
    } else {
        bouton = await page.waitForSelector(
            '#page >> text=/Aucun de ces éléments ne correspond à .* situation/'
        )
    }
    await Promise.all([
        bouton.click(),
        page.waitForNavigation({ url: '**/#caracteristiques' }),
    ])
}

async function remplirCaracteristiques(page, age, taille, poids) {
    await page.fill('#page #age', age)
    await page.fill('#page #taille', taille)
    await page.fill('#page #poids', poids)
    // TODO: grossesse
    let bouton = await page.waitForSelector('#page >> text="Continuer"')
    const target = age < 15 ? 'pediatrie' : 'activitepro'
    await Promise.all([
        bouton.click(),
        page.waitForNavigation({ url: `**/#${target}` }),
    ])
}

async function remplirActivite(page, activitePro) {
    let label = await page.waitForSelector('#page label[for="activite_pro"]')
    let text

    if (activitePro === true) {
        // Je n’arrive pas à cocher la case directement, alors je clique sur le label
        await label.click()
        text = 'Terminer'
    } else {
        text = 'Je n’ai pas d’activité professionnelle ou bénévole'
    }

    let bouton = await page.waitForSelector(`#page >> text="${text}"`)
    await Promise.all([bouton.click(), page.waitForNavigation({ url: '**/#conseils' })])
}

async function remplirDepistage(page, depistage, resultat) {
    let text

    if (depistage) {
        let checkbox_label = await page.waitForSelector(
            '#page label[for="depistage_checkbox"]'
        )
        await checkbox_label.click()

        let radio_label = await page.waitForSelector(
            `#page label[for="depistage_resultat_${resultat}"]`
        )
        await radio_label.click()

        text = '"Continuer"'
    } else {
        text = '/.* pas passé de test/'
    }

    let bouton = await page.waitForSelector(`#page >> text=${text}`)
    await Promise.all([
        bouton.click(),
        page.waitForNavigation({ url: `**/#residence` }),
    ])
}

async function remplirSymptomesActuels(page, symptomesActuels) {
    let text
    let nextPage

    if (symptomesActuels.length > 0) {
        // Je n’arrive pas à cocher la case directement, alors je clique sur le label
        let label = await page.waitForSelector('#page label[for="symptomes_actuels"]')
        await label.click()

        symptomesActuels.forEach(async (nom) => {
            let label = await page.waitForSelector(
                `#page label[for="symptomes_actuels_${nom}"]`
            )
            await label.click()
        })
        text = '"Continuer"'
        if (
            symptomesActuels &&
            symptomesActuels.length === 1 &&
            symptomesActuels[0] === 'autre'
        ) {
            nextPage = 'symptomespasses'
        } else {
            nextPage = 'debutsymptomes'
        }
    } else {
        text = '/.* pas de symptômes actuellement/'
        nextPage = 'symptomespasses'
    }

    let bouton = await page.waitForSelector(`#page >> text=${text}`)
    await Promise.all([
        bouton.click(),
        page.waitForNavigation({ url: `**/#${nextPage}` }),
    ])
}

async function remplirSymptomesPasses(page, symptomesPasses) {
    let text
    let nextPage

    if (symptomesPasses === true) {
        // Je n’arrive pas à cocher la case directement, alors je clique sur le label
        let label = await page.waitForSelector('#page label[for="symptomes_passes"]')
        await label.click()
        text = '"Continuer"'
        nextPage = 'debutsymptomes'
    } else {
        text = '/.* pas eu de symptômes dans les 7 derniers jours/' // &nbsp; après le 7
        nextPage = 'contactarisque'
    }
    let bouton = await page.waitForSelector(`#page >> text=${text}`)
    await Promise.all([
        bouton.click(),
        page.waitForNavigation({ url: `**/#${nextPage}` }),
    ])
}

async function remplirContactsARisque(page, contactARisque) {
    let text

    if (contactARisque.length > 0) {
        // Je n’arrive pas à cocher la case directement, alors je clique sur le label
        let label = await page.waitForSelector('#page label[for="contact_a_risque"]')
        await label.click()

        contactARisque.forEach(async (nom) => {
            let label = await page.waitForSelector(
                `#page label[for="contact_a_risque_${nom}"]`
            )
            await label.click()
        })
        text = '"Continuer"'
    } else {
        text = '/.* pas eu de contact à risque/'
    }

    let bouton = await page.waitForSelector(`#page >> text=${text}`)
    await Promise.all([
        bouton.click(),
        page.waitForNavigation({ url: `**/#depistage` }),
    ])
}

async function remplirDebutSymptomes(page, date) {
    let label = await page.waitForSelector(`#page label[for="debut_symptomes_${date}"]`)
    await label.click()

    let bouton = await page.waitForSelector('#page >> text="Continuer"')
    await Promise.all([
        bouton.click(),
        page.waitForNavigation({ url: `**/#depistage` }),
    ])
}

export async function remplirSuivi(page, symptomes) {
    // Obligatoires
    let label
    label = await page.waitForSelector(
        `#page label[for="suivi_symptomes_essoufflement_${symptomes.essoufflement}"]`
    )
    await label.click()
    label = await page.waitForSelector(
        `#page label[for="suivi_symptomes_etat_general_${symptomes.etat_general}"]`
    )
    await label.click()
    label = await page.waitForSelector(
        `#page label[for="suivi_symptomes_alimentation_hydratation_${symptomes.alimentation_hydratation}"]`
    )
    await label.click()
    label = await page.waitForSelector(
        `#page label[for="suivi_symptomes_etat_psychologique_${symptomes.etat_psychologique}"]`
    )
    await label.click()
    label = await page.waitForSelector(
        `#page label[for="suivi_symptomes_fievre_${symptomes.fievre}"]`
    )
    await label.click()
    label = await page.waitForSelector(
        `#page label[for="suivi_symptomes_diarrhee_vomissements_${symptomes.diarrhee_vomissements}"]`
    )
    await label.click()

    // Seulement pour les proches
    if (symptomes.confusion) {
        label = await page.waitForSelector(
            `#page label[for="suivi_symptomes_confusion_${symptomes.confusion}"]`
        )
        await label.click()
    }

    // Optionnels
    if (symptomes.maux_de_tete) {
        label = await page.waitForSelector(
            `#page label[for="suivi_symptomes_maux_de_tete_${symptomes.maux_de_tete}"]`
        )
        await label.click()
    }
    if (symptomes.toux) {
        label = await page.waitForSelector(
            `#page label[for="suivi_symptomes_toux_${symptomes.toux}"]`
        )
        await label.click()
    }
}
