import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class Organisation extends Model {}

Organisation.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: () => `org_${uuidv4()}`,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Organisation',
        tableName: 'Organisations',
    }
);

export default Organisation;
