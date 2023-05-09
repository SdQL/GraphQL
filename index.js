import {ApolloServer, UserInputError, gql} from "apollo-server"
import {v1 as uuid} from 'uuid'
import axios from 'axios'


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
        countPersons: async () => {
            const {data: personsFromRestApi} = await axios.get('http://localhost:3000/persons') // Obtenemos los datos de la API REST
            return personsFromRestApi.length // Devolvemos la longitud del array de personas
        },
        getAllPersons: async (root, args) => {

            const {data: personsFromRestApi} = await axios.get('http://localhost:3000/persons') // Obtenemos los datos de la API REST

            if (!args.phone) return personsFromRestApi // Si no se pasa el argumento phone en la query, devuelve todas las personas

            const byPhone = person => // Constante que nos permite filtrar por teléfono para obtener solo los que tienen teléfono
                args.phone === "YES" ? person.phone : !person.phone // Si el argumento es YES, devuelve los que tienen teléfono, si no, los que no tienen teléfono

            return personsFromRestApi.filter(byPhone) // Filtramos el array de personas con la constante que creamos

        },
        getPhoneByName: async (root, args) => {
            const {data: personsFromRestApi} = await axios.get('http://localhost:3000/persons') // Obtenemos los datos de la API REST
            const {name} = args;
            return personsFromRestApi.find(person => person.name === name)
        }
    },

    Mutation: {
        addPerson: async (root, args) => {
            const {data: personsFromRestApi} = await axios.get('http://localhost:3000/persons') // Obtenemos los datos de la API REST

            if (personsFromRestApi.find(p => p.name === args.name)) { // Controlamos que no se repita el nombre en el array
                throw new UserInputError('Este nombre ya existe.', {
                    invalidArgs: args.name,
                })
            }
            const person = {...args, id: uuid()}
            await axios.post('http://localhost:3000/persons', person) // Añadimos la persona a la API REST
            return person
        },

        deletePerson: async (root, args) => {
            const {data: personsFromRestApi} = await axios.get('http://localhost:3000/persons') // Obtenemos los datos de la API REST
            const { name } = args;
            const personToDelete = personsFromRestApi.find(person => person.name === name);

            if (!personToDelete) {
                throw new UserInputError('No se encontró la persona a eliminar', {
                    invalidArgs: args.name,
                });
            }

            await axios.delete(`http://localhost:3000/persons/${personToDelete.id}`) // Eliminar objeto mediante solicitud DELETE
            return personToDelete;
        },

        updatePerson: async (parent, args) => {
            const {data: personsFromRestApi} = await axios.get('http://localhost:3000/persons') // Obtenemos los datos de la API REST
            const { id, name, phone, street, city } = args;
            const index = personsFromRestApi.findIndex(person => person.id === id);
            if (index === -1) {
                throw new Error(`No se pudo encontrar a la persona con el ID ${id}`);
            }
            const updatedPerson = {
                ...personsFromRestApi[index],
                name: name !== undefined ? name : personsFromRestApi[index].name,
                phone: phone !== undefined ? phone : personsFromRestApi[index].phone,
                street: street !== undefined ? street : personsFromRestApi[index].street,
                city: city !== undefined ? city : personsFromRestApi[index].city
            };
            await axios.put(`http://localhost:3000/persons/${id}`, updatedPerson) // Actualizar objeto mediante solicitud PUT
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


