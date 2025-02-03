// this function filters the name by first_name, last_name or full name
export function filterByName(searchKey: string) {
  const searchCondition = searchKey
    ? {
        $or: [
          { first_name: { $regex: searchKey, $options: 'i' } },
          { last_name: { $regex: searchKey, $options: 'i' } },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ['$first_name', ' ', '$last_name'] },
                regex: searchKey,
                options: 'i',
              },
            },
          },
        ],
      }
    : {};

  return searchCondition;
}
