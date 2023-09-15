Cypress.Commands.add('fillSignupFormAndSubmit', (email, password) => {
  cy.intercept('GET', '**/notes').as('getNotes')
  // Lógica do intercept: Escute por requisições GET que terminem em /notes
  // Após isso, dê o nome destas requisições como getNotes, pelo comando .as('getNotes')
  cy.visit('/signup')
  cy.get('#email').type(email)
  cy.get('#password').type(password, { log: false })
  // { log: false } Tem a função de não exibir a variável password no log de comando do cypress. É usado para proteger dados sensíveis

  cy.get('#confirmPassword').type(password, { log: false })
  cy.contains('button', 'Signup').click()
  cy.get('#confirmationCode').should('be.visible')
  cy.mailosaurGetMessage(Cypress.env('MAILOSAUR_SERVER_ID'), {
    sentTo: email
  }).then(message => {
    const confirmationCode = message.html.body.match(/\d{6}/)[0]
    cy.get('#confirmationCode').type(`${confirmationCode}{enter}`)
    cy.wait('@getNotes')
  })
})

Cypress.Commands.add('guiLogin', (
/* Caso não seja passado nenhum valor na chamada do método,
   os valores em Cypress.env serão atribuidos e usados na variáveis */
  username = Cypress.env('USER_EMAIL'),
  password = Cypress.env('USER_PASSWORD')
) => {
  cy.visit('/login')
  cy.get('#email').type(username)
  cy.get('#password').type((password), { log: false })
  cy.contains('button', 'Login').click()
  cy.contains('h1', 'Your Notes').should('be.visible')
})

Cypress.Commands.add('sessionLogin', (
  username = Cypress.env('USER_EMAIL'),
  password = Cypress.env('USER_PASSWORD')
) => {
  const login = () => cy.guiLogin(username, password)
  cy.session(username, login)
})

const attachFileHandler = () => {
  cy.get('#file').selectFile('cypress/fixtures/example.json')
}

Cypress.Commands.add('createNote', (note, attachFile = false) => {
  cy.visit('/notes/new')
  cy.get('#content').type(note)

  if (attachFile) {
    attachFileHandler()
  }

  cy.contains('button', 'Create').click()

  cy.contains('.list-group-item', note).should('be.visible')
})

Cypress.Commands.add('editNote', (note, newNoteValue, attachFile = false) => {
  cy.intercept('GET', '**/notes/**').as('getNote')

  cy.contains('.list-group-item', note).click()
  cy.wait('@getNote')

  cy.get('#content')
    .as('contentField')
    .clear()
  cy.get('@contentField')
    .type(newNoteValue)

  if (attachFile) {
    attachFileHandler()
  }

  cy.contains('button', 'Save').click()

  cy.contains('.list-group-item', newNoteValue).should('be.visible')
  cy.contains('.list-group-item', note).should('not.exist')
})

Cypress.Commands.add('deleteNote', note => {
  cy.contains('.list-group-item', note).click()
  cy.contains('button', 'Delete').click()

  cy.get('.list-group-item')
    .its('length')
    .should('be.at.least', 1)
  cy.contains('.list-group-item', note)
    .should('not.exist')
})
