class QueryBuilder<T> {
  private queryModel: any;
  private query: Record<string, unknown>;

  private mongooseQuery: any;
  private totalQueryConditions: Record<string, unknown> = {};

  constructor(model: any, query: Record<string, unknown>) {
    this.queryModel = model;
    this.query = query;
    this.mongooseQuery = model.find();
  }

  private getPageAndLimit() {
    const page = Math.max(Number(this.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(this.query.limit) || 10, 1), 100);

    return { page, limit };
  }

  search(searchableFields: string[]) {
    const searchTerm =
      typeof this.query.searchTerm === 'string' ? this.query.searchTerm.trim() : '';

    if (searchTerm) {
      const searchCondition = {
        $or: searchableFields.map((field) => ({
          [field]: {
            $regex: searchTerm,
            $options: 'i',
          },
        })),
      };

      this.totalQueryConditions = {
        ...this.totalQueryConditions,
        ...searchCondition,
      };

      this.mongooseQuery = this.mongooseQuery.find(searchCondition);
    }

    return this;
  }

  filter(excludeFields: string[] = []) {
    const queryObj = { ...this.query };

    excludeFields.forEach((field) => {
      delete queryObj[field];
    });

    this.totalQueryConditions = {
      ...this.totalQueryConditions,
      ...queryObj,
    };

    this.mongooseQuery = this.mongooseQuery.find(queryObj);

    return this;
  }

  sort() {
    const sortBy = this.query.sortBy || 'createdAt';
    const sortOrder = this.query.sortOrder === 'asc' ? 1 : -1;

    this.mongooseQuery = this.mongooseQuery.sort({
      [sortBy as string]: sortOrder,
    });

    return this;
  }

  paginate() {
    const { page, limit } = this.getPageAndLimit();
    const skip = (page - 1) * limit;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }

  populate(populateOptions: any) {
    this.mongooseQuery = this.mongooseQuery.populate(populateOptions);
    return this;
  }

  async getPaginatedResult() {
    const { page, limit } = this.getPageAndLimit();
    const total = await this.queryModel.countDocuments(this.totalQueryConditions);
    const data = await this.mongooseQuery.exec();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
    };
  }

  getQuery() {
    return this.mongooseQuery;
  }
}

export default QueryBuilder;
