import {ApolloServer, UserInputError, gql} from "apollo-server"
import {v1 as uuid} from 'uuid'

const persons = [
    {
        name: "Maria",
        phone: "555-1234",
        street: "Calle 5 de Mayo",
        city: "Ciudad de México",
        id: "12345"
    },
    {
        name: "Juan",
        phone: "555-5678",
        street: "Avenida del Sol",
        city: "Lima",
        id: "67890"
    },
    {
        name: "Emily",
        street: "Main Street",
        city: "Nueva York",
        id: "24680"
    }
];

const typeDefinitions = gql`
    enum YesNo {
        YES
        NO
    }
    
    type Address {
        street: String!
        city: String!
    }

    type Person {
        name: String!
        phone: String
        address: Address!
        id: ID!
    }
    
    type Query {
        countPersons: Int!
        getAllPersons(phone: YesNo): [Person]!
        getPhoneByName(name: String!): Person
    }
    
    type Mutation {
        addPerson(
            name: String!
            phone: String
            street: String!
            city: String!
        ): Person
        
        deletePerson(
            name: String!
        ): Person
        
        updatePerson(
            id: ID!
            name: String!
            phone: String
            street: String!
            city: String!
        ): Person
    }
`;

const resolvers = {
    Query: {
        countPersons: () => persons.length,
        getAllPersons: (root, args) => {
            if (!args.phone) return persons // Si no se pasa el argumento phone en la query, devuelve todas las personas

            const byPhone = person => // Constante que nos permite filtrar por teléfono para obtener solo los que tienen teléfono
                args.phone === "YES" ? person.phone : !person.phone // Si el argumento es YES, devuelve los que tienen teléfono, si no, los que no tienen teléfono

            return persons.filter(byPhone) // Filtramos el array de personas con la constante que creamos

        },
        getPhoneByName: (root, args) => {
            const {name} = args;
            return persons.find(person => person.name === name)
        }
    },

    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(p => p.name === args.name)) { // Controlamos que no se repita el nombre en el array
                throw new UserInputError('Este nombre ya existe.', {
                    invalidArgs: args.name,
                })
            }
            const person = {...args, id: uuid()}
            persons.push(person)
            return person
        },

        deletePerson: (root, args) => {
            const { name } = args;
            const index = persons.findIndex(person => person.name === name);
            if (index !== -1) {
                const deletedPerson = persons.splice(index, 1)[0];
                return deletedPerson;
            }
        },

        updatePerson: (parent, args) => {
            const { id, name, phone, street, city } = args;
            const index = persons.findIndex(person => person.id === id);
            if (index === -1) {
                throw new Error(`No se pudo encontrar a la persona con el ID ${id}`);
            }
            const updatedPerson = {
                ...persons[index],
                name: name !== undefined ? name : persons[index].name,
                phone: phone !== undefined ? phone : persons[index].phone,
                street: street !== undefined ? street : persons[index].street,
                city: city !== undefined ? city : persons[index].city
            };
            persons[index] = updatedPerson;
            return updatedPerson;
        }


    },

    Person: {
        address: (root) => {
            return {
                street: root.street,
                city: root.city
            }
        }
    }
}

const server = new ApolloServer({
    typeDefs: typeDefinitions,
    resolvers
})

server.listen().then(({url}) => {
    console.log(`🚀 Server ready at ${url}`);
});


