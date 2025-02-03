import { GetClockOutReasonQueryDTO } from '@dto/references/clock-out-query-param';
import { Injectable } from '@nestjs/common';
import { FilterQuery } from 'mongoose';

@Injectable()
export class BookingService {
  constructor() {}

  /**
   * This function generates filter criteria based on search key and ID for clock out
   * reasons.
   */
  getBookingFilters(queryParams: GetClockOutReasonQueryDTO) {
    const { searchKey, _id } = queryParams;

    const filterCriteria: FilterQuery<GetClockOutReasonQueryDTO> = {};

    filterCriteria.is_delete = false;

    if (searchKey) filterCriteria.customer_name = { $regex: searchKey, $options: 'i' };

    if (_id) filterCriteria._id = _id;

    return filterCriteria;
  }
}
