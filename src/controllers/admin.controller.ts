import { Controller, Put, Authenticated, Post, BodyParams } from "@tsed/common";
import { Summary, Returns, Description } from "@tsed/swagger";
import { User } from "../data/models/entities/user.entity";
import { UsersService } from "../services/users/users.service";
import { CryptoService } from "../services/auth/crypto.service";
import { BadRequest, NotFound } from "ts-httpexceptions";
import { AssignClaims } from "../data/models/requests/assign.claims.model";

@Controller("/admin")
export default class AdminController {

    constructor(private usersService: UsersService, private crypto: CryptoService) {
    }

    @Post("/users")
    @Authenticated({ claim: 'can_create_users' })
    @Summary("Creates new user")
    @Description(`
        Required claim: can_create_users.
        The current implementation allows an administrator to create one user using password / confirm properties 
        but it will be switched to an invitation method in the future.
    `)
    @Returns(User)
    async create(@BodyParams() user: User): Promise<User> {

        //Password created user
        if (user.password && user.confirm) {
            if (user.password !== user.confirm) {
                throw new BadRequest('passwords do not match')
            }

            const passHash = await this.crypto.hash(user.password);
            user.password = passHash;
            return this.usersService.create(user);
        } else {
            //invitation to be implemented 
        }
    }

    @Post("/claims/assign")
    @Authenticated({ claim: 'can_create_users' })
    @Summary('Assigns a set of claims to an user')
    @Description(`
        Claims required: can_crete_users
        Allows an administrator to assign multiple claims to one user
    `)
    @Returns(User)
    async assign(@BodyParams() req: AssignClaims): Promise<User> {
        const { claims, userId } = req;
        const user = await this.usersService.findById(userId);
        if (user) {
            claims.forEach(async claim => {
                await this.usersService.storeClaim(claim, user);
            });

            return user;
        } else {
            throw new NotFound(`User not found`);
        }
    }

    @Put("/echo")
    @Authenticated({ claim: 'can_do_everything' })
    @Summary('Echo administrator method')
    async echo(@BodyParams() req: any): Promise<any> {
        return req;
    }


}
