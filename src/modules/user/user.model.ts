import bcrypt from 'bcrypt';
import { model, Schema } from 'mongoose';
import config from '../../config';
import { IUser, IUserModel } from './user.interface';
import { USER_ROLE, USER_STATUS } from './user.constant';

const userSchema = new Schema<IUser, IUserModel>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },

    dateOfBirth: {
      type: Date,
    },

    avatar: {
      publicId: {
        type: String,
        trim: true,
      },

      url: {
        type: String,
        trim: true,
      },
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.CUSTOMER,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      required: true,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },

    emailVerification: {
      otpHash: {
        type: String,
        select: false,
      },

      expiresAt: {
        type: Date,
        select: false,
      },

      attempts: {
        type: Number,
        default: 0,
        min: 0,
        select: false,
      },
      lastSentAt: {
        type: Date,
        select: false,
      },
    },
    passwordReset: {
      otpHash: {
        type: String,
        select: false,
      },

      expiresAt: {
        type: Date,
        select: false,
      },

      attempts: {
        type: Number,
        default: 0,
        min: 0,
        select: false,
      },
    },

    lastLoginAt: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre('save', async function (next) {
  this.password = await bcrypt.hash(this.password, Number(config.bcryptSaltRounds));

  next();
});

userSchema.post('save', function (doc, next) {
  doc.password = '';
  next();
});

userSchema.statics.isPasswordMatch = async function (
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }

  return bcrypt.compare(password, hashedPassword);
};

userSchema.statics.isUserExistByEmail = async function (email: string) {
  return await this.findOne({ email });
};

userSchema.statics.isUserExistByEmailWithPassword = async function (email: string) {
  return await this.findOne({ email }).select('+password');
};

userSchema.statics.isUserExistById = async function (_id: string) {
  return await this.findById(_id);
};

userSchema.statics.isUserExistByIdWithPassword = async function (_id: string) {
  return await this.findById(_id).select('+password');
};

export const User = model<IUser, IUserModel>('User', userSchema);
