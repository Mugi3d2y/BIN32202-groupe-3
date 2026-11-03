import {test, expect} from '@playwright/test';

test.describe('Candidature à une offre publiée, avec et sans message',() => {

    test('Cas 1 : Candidaté de manière normale avec message', async ({page}) => {
        await page.goto("http://localhost:5173/");
        await page.getByRole('button', {name : 'Louis Claes'}).click();
        await page.goto("http://localhost:5173/offres");
        await page
            .getByRole('row', { name: /Application React de gestion/i })
            .getByRole('button', { name: 'Candidater' })
            .click();
        await page.fill('#application-message', 'Cas 1 ');
        await page.getByRole('button', {name : 'Envoyer ma candidature'}).click();
    });

    test('Cas 2 : Candidaté de manière normale sans message', async ({page}) => {
        await page.goto("http://localhost:5173/");
        await page.getByRole('button', {name : 'Aminata Diallo'}).click();
        await page.goto("http://localhost:5173/offres");
        await page
            .getByRole('row', { name: /Assistant conversationnel interne/i })
            .getByRole('button', { name: 'Candidater' })
            .click();
        await page.getByRole('button', {name : 'Envoyer ma candidature'}).click();
    });

    test('Cas 3 : Présence de la candidature et de son statut après rechargement', async ({page}) => {
        await page.goto("http://localhost:5173/");
        await page.getByRole('button', {name : /Lucas Dupont/i}).click();
        await page.goto("http://localhost:5173/offres");
        await page
            .getByRole('row', { name: /API REST de facturation/i })
            .getByRole('button', { name: 'Candidater' })
            .click();
        await page.getByRole('button', {name : 'Envoyer ma candidature'}).click();
        await page.goto("http://localhost:5173/mes-candidatures");
        await expect(page.getByRole('table')).toContainText('API REST de facturation');
        await expect(page.getByRole('table')).toContainText('IN_PROGRESS');
    });

    test('Cas 4 : Candidater 2 fois pour la meme offre', async ({page}) => {
        await page.goto("http://localhost:5173/");
        await page.getByRole('button', {name : 'Youssef El Amrani'}).click();
        await page.goto("http://localhost:5173/offres");
        await page
            .getByRole('row', { name: /API REST de facturation/i })
            .getByRole('button', { name: 'Candidater' })
            .click();
        await page.getByRole('button', {name : 'Envoyer ma candidature'}).click();
        await page
            .getByRole('row', { name: /API REST de facturation/i })
            .getByRole('button', { name: 'Candidater' })
            .click();
        await page.getByRole('button', {name : 'Envoyer ma candidature'}).click();
        await expect(page.getByText("La candidature n'a pas pu être enregistrée (statut 409)")).toBeVisible();
    });

    test('Cas 5 : Retrait d’une candidature encore en cours', async ({page}) => {
        await page.goto("http://localhost:5173/");
        await page.getByRole('button', {name : 'Léa Mertens'}).click();
        await page.goto("http://localhost:5173/offres");
        await page
            .getByRole('row', { name: /Assistant conversationnel interne/i })
            .getByRole('button', { name: 'Candidater' })
            .click();
        await page.getByRole('button', {name : 'Envoyer ma candidature'}).click();
        
    })
})