import {ApolloServer, gql} from "apollo-server"
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
        getAllPersons: [Person]!
        getPhoneByName(name: String!): Person
    }
`;

const resolvers = {
    Query: {
        countPersons: () => persons.length,
        getAllPersons: () => persons,
        getPhoneByName: (root, args) => {
            const {name} = args;
            return persons.find(person => person.name === name)
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


