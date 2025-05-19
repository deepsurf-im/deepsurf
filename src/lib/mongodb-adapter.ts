import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb";
 
export const authAdapter = MongoDBAdapter(clientPromise); 