import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://gauthamsriram16:PM5X01kRNluoKVie@delta-onsite-1.4vlboga.mongodb.net/";

console.log('MONGODB_URI:', MONGODB_URI);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

connectDB();

const ProblemSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  is_premium: {
    type: Boolean,
    default: false,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  solution_link: {
    type: String,
    default: '',
  },
  acceptance_rate: {
    type: String,
    default: '',
  },
  frequency: {
    type: Number,
    default: 0,
  },
  url: {
    type: String,
    required: true,
  },
  discuss_count: {
    type: Number,
    default: 0,
  },
  accepted: {
    type: Number,
    default: 0,
  },
  submissions: {
    type: Number,
    default: 0,
  },
  companies: {
    type: [String],
    default: [],
  },
  related_topics: {
    type: [String],
    default: [],
  },
  asked_by_faang: {
    type: Boolean,
    default: false,
  },
  similar_questions: [
    {
      title: String,
      slug: String,
      difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
      },
    }
  ],
  test_cases: [
    {
      input: String,
      expected_output: String
    }
  ]
}, { timestamps: true });

const ProblemModel = mongoose.models.Problems || mongoose.model("Problems", ProblemSchema);

export { connectDB, ProblemModel };
export default ProblemModel;